import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createContent } from "../../packages/content/src/index";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Content audience tests require local vq_test");
const db = createDatabase(url),
  origin = "http://127.0.0.1:3000";
const root = await mkdtemp(path.join(tmpdir(), "vq-content-"));
const app = buildApi(db.repository, {
  identity: db.identity,
  profiles: db.profiles,
  social: db.social,
  media: db.media,
  mediaRoot: root,
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
      remoteAddress: `127.0.0.${230 + i}`,
      headers: { origin },
      payload: {
        email: `content-audience-${randomUUID()}@example.test`,
        password: "Content-audience!99",
      },
    });
    expect(r.statusCode).toBe(201);
    users.push({
      id: r.json().account.id,
      cookie: String(r.headers["set-cookie"]).split(";")[0],
    });
  }
});
afterAll(async () => {
  try {
    await db.pool.query(
      "DELETE FROM content_reports WHERE reporter_id=ANY($1::uuid[])",
      [users.map((u) => u.id)],
    );
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      users.map((u) => u.id),
    ]);
  } finally {
    await app.close();
    await db.close();
    await rm(root, { recursive: true, force: true });
  }
});
const input = {
  text: "Real Gossip",
  locationLabel: "A user label",
  audience: "PUBLIC",
  mediaId: null,
};
async function post(extra = {}) {
  const r = await app.inject({
    method: "POST",
    url: "/v1/content/me/posts",
    headers: h(0),
    payload: { ...input, ...extra },
  });
  expect(r.statusCode).toBe(201);
  return r.json().post;
}
async function image(i: number, visibility = "content") {
  const r = await app.inject({
    method: "POST",
    url: "/v1/media/uploads",
    headers: h(i),
    payload: { visibility },
  });
  expect(r.statusCode).toBe(201);
  const id = r.json().media.id;
  const upload = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${id}`,
    headers: { ...h(i), "content-type": "image/png" },
    payload: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
      "base64",
    ),
  });
  expect(upload.statusCode).toBe(200);
  return id;
}
async function follow(i: number, j: number, following = true) {
  return app.inject({
    method: "PUT",
    url: `/v1/social/users/${users[j].id}/follow`,
    headers: h(i),
    payload: { following },
  });
}
it("uses current relationships for both audience transitions and every scoped image request", async () => {
  const mediaId = await image(0);
  let p = await post({ mediaId });
  const bytes = `/v1/media/${mediaId}/image?postId=${p.id}`;
  expect((await app.inject({ url: bytes })).statusCode).toBe(200);
  expect(
    (await app.inject({ url: `/v1/media/${mediaId}/image`, headers: h(0) }))
      .statusCode,
  ).toBe(404);
  const edit = async (audience: string) => {
    const r = await app.inject({
      method: "PUT",
      url: `/v1/content/me/posts/${p.id}`,
      headers: h(0),
      payload: { ...input, mediaId, audience, version: p.version },
    });
    expect(r.statusCode).toBe(200);
    p = r.json().post;
  };
  await edit("FOLLOWERS_ONLY");
  for (const headers of [undefined, h(1), h(2)])
    expect((await app.inject({ url: bytes, headers })).statusCode).toBe(404);
  await follow(1, 0);
  expect((await app.inject({ url: bytes, headers: h(1) })).statusCode).toBe(
    200,
  );
  expect(
    (await app.inject({ url: bytes, headers: h(1) })).headers["cache-control"],
  ).toContain("no-store");
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}`, headers: h(2) }))
      .statusCode,
  ).toBe(404);
  await follow(1, 0, false);
  expect((await app.inject({ url: bytes, headers: h(1) })).statusCode).toBe(
    404,
  );
  await edit("PUBLIC");
  expect((await app.inject({ url: bytes })).statusCode).toBe(200);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/content/me/posts/${p.id}`,
        headers: h(1),
        payload: { ...input, mediaId, version: p.version },
      })
    ).statusCode,
  ).toBe(404);
});
it("mutually blocks post/interaction/media access, removes both follows, and never restores edges implicitly", async () => {
  await follow(0, 1);
  await follow(1, 0);
  const p = await post();
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/social/users/${users[1].id}/block`,
        headers: h(0),
        payload: { blocked: true },
      })
    ).statusCode,
  ).toBe(200);
  for (const [a, b] of [
    [0, 1],
    [1, 0],
  ]) {
    const s = await app.inject({
      url: `/v1/social/users/${users[b].id}`,
      headers: h(a),
    });
    expect(s.json()).toMatchObject({ following: false, followedBy: false });
    expect((await follow(a, b)).statusCode).toBe(403);
  }
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}`, headers: h(1) }))
      .statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/content/posts/${p.id}/reaction`,
        headers: h(1),
        payload: { liked: true },
      })
    ).statusCode,
  ).toBe(404);
  await app.inject({
    method: "PUT",
    url: `/v1/social/users/${users[1].id}/block`,
    headers: h(0),
    payload: { blocked: false },
  });
  expect(
    (await app.inject({ url: `/v1/content/posts/${p.id}`, headers: h(1) }))
      .statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: `/v1/social/users/${users[0].id}`,
        headers: h(1),
      })
    ).json().following,
  ).toBe(false);
});
it("persists idempotent likes, authorized comments and reply tombstones without awarding points", async () => {
  const p = await post();
  const base = `/v1/content/posts/${p.id}`;
  for (let i = 0; i < 2; i++)
    expect(
      (
        await app.inject({
          method: "PUT",
          url: `${base}/reaction`,
          headers: h(1),
          payload: { liked: true },
        })
      ).statusCode,
    ).toBe(200);
  expect((await app.inject({ url: base, headers: h(1) })).json()).toMatchObject(
    { post: { likeCount: 1, liked: true } },
  );
  const c = await app.inject({
    method: "POST",
    url: `${base}/comments`,
    headers: h(1),
    payload: { text: "Parent", parentId: null },
  });
  expect(c.statusCode).toBe(201);
  const reply = await app.inject({
    method: "POST",
    url: `${base}/comments`,
    headers: h(2),
    payload: { text: "Reply", parentId: c.json().comment.id },
  });
  expect(reply.statusCode).toBe(201);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `${base}/comments/${c.json().comment.id}`,
        headers: h(0),
      })
    ).statusCode,
  ).toBe(204);
  const comments = (
    await app.inject({ url: `${base}/comments`, headers: h(2) })
  ).json().comments;
  expect(
    comments.find((r: { id: string }) => r.id === c.json().comment.id),
  ).toMatchObject({ text: null, author: null });
  expect(
    comments.find((r: { id: string }) => r.id === reply.json().comment.id).text,
  ).toBe("Reply");
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${base}/reaction`,
        payload: { liked: true },
        headers: { origin },
      })
    ).statusCode,
  ).toBe(401);
});
it("rejects private/foreign references and keeps recoverable images private on deletion", async () => {
  for (const mediaId of [await image(1), await image(0, "private")])
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/v1/content/me/posts",
          headers: h(0),
          payload: { ...input, mediaId },
        })
      ).statusCode,
    ).toBe(422);
  const mediaId = await image(0);
  const p = await post({ text: "", mediaId });
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/content/me/posts/${p.id}`,
        headers: h(0),
        payload: { version: p.version },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: `/v1/media/${mediaId}/image?postId=${p.id}`,
        headers: h(0),
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/media/${mediaId}`,
        headers: h(0),
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/content/me/posts/${p.id}/restore`,
        headers: h(0),
        payload: { version: p.version + 1 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await app.inject({ url: `/v1/media/${mediaId}/image?postId=${p.id}` }))
      .statusCode,
  ).toBe(200);
});
it("distributes only own/followed records with stable tied-time pagination and current guest visibility", async () => {
  await follow(2, 0);
  const ids: string[] = [],
    publicIds: string[] = [];
  for (let i = 0; i < 22; i++) {
    const p = await post({ audience: i % 2 ? "PUBLIC" : "FOLLOWERS_ONLY" });
    ids.push(p.id);
    if (i % 2) publicIds.push(p.id);
  }
  await db.pool.query(
    "UPDATE content_posts SET created_at='2031-01-01T00:00:00.123456Z' WHERE id=ANY($1::uuid[])",
    [ids],
  );
  const first = (
    await app.inject({ url: "/v1/content/feed", headers: h(2) })
  ).json();
  expect(first.posts.map((p: { id: string }) => p.id)).toEqual(
    [...ids].sort().reverse().slice(0, 20),
  );
  const query = new URLSearchParams({
    afterTime: first.nextCursor.at,
    afterId: first.nextCursor.id,
  });
  const second = (
    await app.inject({ url: `/v1/content/feed?${query}`, headers: h(2) })
  ).json();
  expect(
    [...first.posts, ...second.posts]
      .filter((p: { id: string }) => ids.includes(p.id))
      .map((p: { id: string }) => p.id),
  ).toEqual([...ids].sort().reverse());
  const guest = (await app.inject({ url: "/v1/content/feed" })).json();
  expect(
    guest.posts
      .filter((p: { id: string }) => ids.includes(p.id))
      .map((p: { id: string }) => p.id),
  ).toEqual(publicIds.sort().reverse());
  await follow(2, 0, false);
  expect(
    (await app.inject({ url: "/v1/content/feed", headers: h(2) }))
      .json()
      .posts.some((p: { id: string }) => ids.includes(p.id)),
  ).toBe(false);
});
it("retires expired attachments only after their last ordinary reference is gone", async () => {
  const mediaId = await image(0),
    a = await post({ mediaId }),
    b = await post({ mediaId });
  const storage = createLocalMediaStorage(root),
    service = createContent(db.content, {
      media: createMedia(db.media, storage, imageProcessor),
    });
  async function expire(p: { id: string; version: number }) {
    await app.inject({
      method: "DELETE",
      url: `/v1/content/me/posts/${p.id}`,
      headers: h(0),
      payload: { version: p.version },
    });
    await db.pool.query(
      "UPDATE content_posts SET deleted_at=now()-interval '11 days' WHERE id=$1",
      [p.id],
    );
    await service.purgeExpired();
  }
  await expire(a);
  expect((await db.media.read(mediaId))?.status).toBe("ready");
  expect(
    (await app.inject({ url: `/v1/media/${mediaId}/image?postId=${b.id}` }))
      .statusCode,
  ).toBe(200);
  await expire(b);
  expect(await db.media.read(mediaId)).toBe(null);
  await expect(storage.read(mediaId, "image")).rejects.toThrow();
});
it("moderator decisions also revoke scoped image delivery without retaining image evidence", async () => {
  await db.pool.query(
    "INSERT INTO identity_privileges(user_id,privilege) VALUES($1,'content.moderate')",
    [users[2].id],
  );
  try {
    for (const decision of ["hide", "remove"]) {
      const mediaId = await image(0),
        p = await post({ mediaId });
      const reported = await app.inject({
        method: "POST",
        url: `/v1/content/posts/${p.id}/reports`,
        headers: h(1),
        payload: { reason: "other" },
      });
      expect(reported.statusCode).toBe(201);
      const id = reported.json().report.id;
      const evidence = (
        await app.inject({
          url: `/v1/content/moderation/reports/${id}`,
          headers: h(2),
        })
      ).json();
      expect(JSON.stringify(evidence.evidence)).not.toContain(mediaId);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/v1/content/moderation/reports/${id}`,
            headers: h(2),
            payload: { decision, version: 1 },
          })
        ).statusCode,
      ).toBe(200);
      for (const headers of [undefined, h(0), h(1), h(2)])
        expect(
          (
            await app.inject({
              url: `/v1/media/${mediaId}/image?postId=${p.id}`,
              headers,
            })
          ).statusCode,
        ).toBe(404);
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/v1/content/me/posts/${p.id}/restore`,
            headers: h(0),
            payload: { version: 2 },
          })
        ).statusCode,
      ).toBe(404);
      await db.pool.query("DELETE FROM content_reports WHERE id=$1", [id]);
    }
  } finally {
    await db.pool.query(
      "DELETE FROM identity_privileges WHERE user_id=$1 AND privilege='content.moderate'",
      [users[2].id],
    );
  }
});
