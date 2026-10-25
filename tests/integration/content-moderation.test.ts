import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, it, expect } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Moderation tests require local vq_test");
const db = createDatabase(url),
  origin = "http://127.0.0.1:3000",
  app = buildApi(db.repository, {
    identity: db.identity,
    profiles: db.profiles,
    social: db.social,
    content: db.content,
    allowedOrigins: [origin],
  });
const users: { id: string; cookie: string }[] = [];
const h = (i: number) => ({ origin, cookie: users[i].cookie });
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 3; i++) {
    const r = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${240 + i}`,
      payload: {
        email: `moderation-fixture-${randomUUID()}@example.test`,
        password: "Isolated-moderation!91",
      },
    });
    expect(r.statusCode).toBe(201);
    users.push({
      id: r.json().account.id,
      cookie: String(r.headers["set-cookie"]).split(";")[0],
    });
  }
  // Temporary isolated fixtures only; no application/migration grants privileges.
  await db.pool.query(
    "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'business.review'),($2,'content.moderate')",
    [users[1].id, users[2].id],
  );
});
afterAll(async () => {
  try {
    await db.pool.query(
      "DELETE FROM content_reports WHERE reporter_id=ANY($1::uuid[]) OR moderator_id=ANY($1::uuid[])",
      [users.map((u) => u.id)],
    );
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users.map((u) => u.id),
    ]);
  } finally {
    await app.close();
    await db.close();
  }
});
async function post() {
  const r = await app.inject({
    method: "POST",
    url: "/v1/content/me/posts",
    headers: h(0),
    payload: {
      text: "Actual reported text",
      locationLabel: "Authored label",
      audience: "PUBLIC",
    },
  });
  expect(r.statusCode).toBe(201);
  return r.json().post;
}
async function report(id: string, extra = {}) {
  return app.inject({
    method: "POST",
    url: `/v1/content/posts/${id}/reports`,
    headers: h(1),
    payload: {
      reason: "spam_scam",
      details: "Actual explanatory text",
      ...extra,
    },
  });
}
const mod = "/v1/content/moderation/reports";
it("validates approved categories and creates one idempotent active case without hiding the post", async () => {
  const p = await post();
  for (const payload of [
    { reason: "invented" },
    { reason: "other", reporterId: users[0].id },
    { reason: "other", details: "x".repeat(1001) },
  ])
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/v1/content/posts/${p.id}/reports`,
          headers: h(1),
          payload,
        })
      ).statusCode,
    ).toBe(400);
  const results = await Promise.all([
    report(p.id),
    report(p.id, { reason: "other", details: "Repeated submission" }),
  ]);
  expect(results.map((r) => r.statusCode)).toEqual([201, 201]);
  expect(results[0].json().report.id).toBe(results[1].json().report.id);
  expect(JSON.stringify(results[0].json())).not.toContain(
    "Actual reported text",
  );
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}` })).statusCode,
  ).toBe(200);
  expect(
    (
      await db.pool.query(
        "SELECT id FROM content_reports WHERE target_id=$1 AND status='pending'",
        [p.id],
      )
    ).rowCount,
  ).toBe(1);
});
it("restricts evidence and decisions to the dedicated trusted Identity permission", async () => {
  const p = await post(),
    r = await report(p.id),
    id = r.json().report.id;
  expect(
    (
      await app.inject({
        url: "/v1/content/moderation/capability",
        headers: h(0),
      })
    ).json().allowed,
  ).toBe(false);
  expect(
    (
      await app.inject({
        url: "/v1/content/moderation/capability",
        headers: h(1),
      })
    ).json().allowed,
  ).toBe(false);
  expect(
    (
      await app.inject({
        url: "/v1/content/moderation/capability",
        headers: h(2),
      })
    ).json().allowed,
  ).toBe(true);
  expect((await app.inject({ url: `${mod}/${id}` })).statusCode).toBe(401);
  for (const i of [0, 1]) {
    expect(
      (await app.inject({ url: `${mod}/${id}`, headers: h(i) })).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `${mod}/${id}`,
          headers: h(i),
          payload: { decision: "hide", version: 1 },
        })
      ).statusCode,
    ).toBe(403);
  }
  const evidence = await app.inject({ url: `${mod}/${id}`, headers: h(2) });
  expect(evidence.statusCode).toBe(200);
  expect(evidence.headers["cache-control"]).toBe("no-store");
  expect(evidence.json().evidence.post.text).toBe(p.text);
  expect(evidence.json().evidence.post).not.toHaveProperty("mediaId");
  const decision = await app.inject({
    method: "PUT",
    url: `${mod}/${id}`,
    headers: h(2),
    payload: { decision: "hide", version: 1 },
  });
  expect(decision.statusCode).toBe(200);
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}` })).statusCode,
  ).toBe(404);
  expect(
    (await app.inject({ url: `/v1/content/me/posts/${p.id}`, headers: h(0) }))
      .statusCode,
  ).toBe(404);
  const stored = (
    await db.pool.query(
      "SELECT decided_at,evidence_expires_at FROM content_reports WHERE id=$1",
      [id],
    )
  ).rows[0];
  expect(
    stored.evidence_expires_at.getTime() - stored.decided_at.getTime(),
  ).toBe(30 * 86400000);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${mod}/${id}`,
        headers: h(2),
        payload: { decision: "remove", version: 1 },
      })
    ).statusCode,
  ).toBe(409);
});
it("expires pending reports at 30 days, deletes evidence and never hides the target", async () => {
  const p = await post(),
    id = (await report(p.id)).json().report.id;
  await db.pool.query(
    "UPDATE content_reports SET submitted_at=now()-interval '31 days',pending_until=now()-interval '1 day',evidence_expires_at=now()-interval '1 day' WHERE id=$1",
    [id],
  );
  expect(
    (await app.inject({ url: `${mod}/${id}`, headers: h(2) })).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${mod}/${id}`,
        headers: h(2),
        payload: { decision: "remove", version: 1 },
      })
    ).statusCode,
  ).toBe(410);
  await db.content.expireReports();
  const row = (
    await db.pool.query(
      "SELECT status,evidence,reason,details FROM content_reports WHERE id=$1",
      [id],
    )
  ).rows[0];
  expect(row).toEqual({
    status: "expired",
    evidence: null,
    reason: null,
    details: null,
  });
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}` })).statusCode,
  ).toBe(200);
  expect((await report(p.id)).statusCode).toBe(409);
});
it("expires post-decision text/metadata without undoing moderation and never restores removed comments", async () => {
  const p = await post();
  const c = await app.inject({
    method: "POST",
    url: `/v1/content/posts/${p.id}/comments`,
    headers: h(0),
    payload: { text: "Reported comment", parentId: null },
  });
  const comment = c.json().comment;
  await app.inject({
    method: "POST",
    url: `/v1/content/posts/${p.id}/comments`,
    headers: h(1),
    payload: { text: "Surviving reply", parentId: comment.id },
  });
  const r = await app.inject({
    method: "POST",
    url: `/v1/content/posts/${p.id}/comments/${comment.id}/reports`,
    headers: h(1),
    payload: { reason: "privacy_violation" },
  });
  expect(r.statusCode).toBe(201);
  const id = r.json().report.id;
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${mod}/${id}`,
        headers: h(2),
        payload: { decision: "remove", version: 1 },
      })
    ).statusCode,
  ).toBe(200);
  const comments = (
    await app.inject({ url: `/v1/content/posts/${p.id}/comments` })
  ).json().comments;
  expect(
    comments.find((row: { id: string }) => row.id === comment.id).text,
  ).toBe(null);
  expect(
    comments.some((row: { text: string }) => row.text === "Surviving reply"),
  ).toBe(true);
  await db.pool.query(
    "UPDATE content_reports SET decided_at=now()-interval '31 days',evidence_expires_at=now()-interval '1 day' WHERE id=$1",
    [id],
  );
  await db.content.expireReports();
  expect(
    (
      await db.pool.query(
        "SELECT evidence,reason,details FROM content_reports WHERE id=$1",
        [id],
      )
    ).rows[0],
  ).toEqual({ evidence: null, reason: null, details: null });
  expect(
    (await app.inject({ url: `${mod}/${id}`, headers: h(2) })).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/content/posts/${p.id}/comments/${comment.id}/restore`,
        headers: h(0),
      })
    ).statusCode,
  ).toBe(404);
});
it("rolls back a decision that crosses the pending deadline while waiting for the target lock", async () => {
  const p = await post(),
    id = (await report(p.id)).json().report.id;
  const lock = await db.pool.connect();
  try {
    await lock.query("BEGIN");
    await lock.query("SELECT id FROM content_posts WHERE id=$1 FOR UPDATE", [
      p.id,
    ]);
    await db.pool.query(
      "UPDATE content_reports SET pending_until=clock_timestamp()+interval '1 second' WHERE id=$1",
      [id],
    );
    const decision = app.inject({
      method: "PUT",
      url: `${mod}/${id}`,
      headers: h(2),
      payload: { decision: "hide", version: 1 },
    });
    await lock.query("SELECT pg_sleep(1.3)");
    await lock.query("COMMIT");
    expect((await decision).statusCode).toBe(410);
    expect(
      (await app.inject({ url: `/v1/content/posts/${p.id}` })).statusCode,
    ).toBe(200);
  } finally {
    await lock.query("ROLLBACK");
    lock.release();
  }
});
it("rechecks the dedicated permission rather than caching moderator authority", async () => {
  await db.pool.query(
    "DELETE FROM identity_privileges WHERE user_id=$1 AND privilege='content.moderate'",
    [users[2].id],
  );
  expect((await app.inject({ url: mod, headers: h(2) })).statusCode).toBe(403);
  expect(
    (
      await app.inject({
        url: "/v1/content/moderation/capability",
        headers: h(2),
      })
    ).json().allowed,
  ).toBe(false);
});
