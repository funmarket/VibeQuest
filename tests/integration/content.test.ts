import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, it, expect } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["127.0.0.1", "localhost"].includes(new URL(url).hostname)
)
  throw new Error("Content tests require local vq_test");
const db = createDatabase(url);
const otherDb = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const options = {
  identity: db.identity,
  content: db.content,
  allowedOrigins: [origin],
};
const app = buildApi(db.repository, options);
const other = buildApi(otherDb.repository, {
  ...options,
  identity: otherDb.identity,
  content: otherDb.content,
});
const people: { id: string; cookie: string }[] = [];
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 2; i++) {
    const response = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${220 + i}`,
      payload: {
        email: `content-${randomUUID()}@example.test`,
        password: "Actual-content-test!91",
      },
    });
    expect(response.statusCode).toBe(201);
    people.push({
      id: response.json().account.id,
      cookie: String(response.headers["set-cookie"]).split(";")[0],
    });
  }
});
afterAll(async () => {
  try {
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      people.map((p) => p.id),
    ]);
  } finally {
    await Promise.all([app.close(), other.close()]);
    await Promise.all([db.close(), otherDb.close()]);
  }
});
const base = "/v1/content/me/posts";
const input = {
  text: "Actual persisted post",
  locationLabel: "Authored label",
  audience: "PUBLIC",
};
function headers(i = 0) {
  return { origin, cookie: people[i].cookie };
}
async function create() {
  const response = await app.inject({
    method: "POST",
    url: base,
    headers: headers(),
    payload: input,
  });
  expect(response.statusCode).toBe(201);
  return response.json().post;
}

it("persists author records across instances without exposing them to other actors or guests", async () => {
  const post = await create();
  const read = await other.inject({
    url: `${base}/${post.id}`,
    headers: headers(),
  });
  expect(read.statusCode).toBe(200);
  expect(read.headers["cache-control"]).toBe("no-store");
  expect(read.json().post).toMatchObject({
    ...input,
    authorId: people[0].id,
    version: 1,
  });
  expect(
    (await other.inject({ url: `${base}/${post.id}`, headers: headers(1) }))
      .statusCode,
  ).toBe(404);
  expect((await other.inject({ url: `${base}/${post.id}` })).statusCode).toBe(
    401,
  );
  expect(
    (await other.inject({ url: `/v1/content/posts/${post.id}` })).statusCode,
  ).toBe(503);
});

it("rejects spoofed actors, over-limit inputs and unauthorized attachments while permitting approved audience edits", async () => {
  for (const payload of [
    { ...input, authorId: people[1].id },
    { ...input, text: "😀".repeat(141) },
    { ...input, locationLabel: "😀".repeat(21) },
    { ...input, text: " " },
    { ...input, localVibes: true },
  ])
    expect(
      (
        await app.inject({
          method: "POST",
          url: base,
          headers: headers(),
          payload,
        })
      ).statusCode,
    ).toBe(400);
  const post = await create();
  expect(
    (
      await app.inject({
        method: "POST",
        url: base,
        headers: headers(),
        payload: { ...input, mediaId: randomUUID() },
      })
    ).statusCode,
  ).toBe(422);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${base}/${post.id}`,
        headers: headers(),
        payload: {
          text: "edit",
          locationLabel: "",
          version: 1,
          audience: "FOLLOWERS_ONLY",
        },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "POST",
        url: base,
        headers: { ...headers(), origin: "https://untrusted.test" },
        payload: input,
      })
    ).statusCode,
  ).toBe(403);
});

it("atomically rejects stale or foreign mutations and supports author delete/restore", async () => {
  const post = await create();
  const edit = { text: "Edited", locationLabel: "", version: post.version };
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `${base}/${post.id}`,
        headers: headers(1),
        payload: edit,
      })
    ).statusCode,
  ).toBe(404);
  const races = await Promise.all(
    [app, other].map((server) =>
      server.inject({
        method: "PUT",
        url: `${base}/${post.id}`,
        headers: headers(),
        payload: edit,
      }),
    ),
  );
  expect(races.map((r) => r.statusCode).sort()).toEqual([200, 409]);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `${base}/${post.id}`,
        headers: headers(),
        payload: { version: 1 },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `${base}/${post.id}`,
        headers: headers(),
        payload: { version: 2 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await app.inject({ url: `${base}/${post.id}`, headers: headers() }))
      .statusCode,
  ).toBe(404);
  const deleted = await app.inject({
    url: `${base}?deleted=true`,
    headers: headers(),
  });
  expect(
    deleted.json().posts.some((p: { id: string }) => p.id === post.id),
  ).toBe(true);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `${base}/${post.id}/restore`,
        headers: headers(1),
        payload: { version: 3 },
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `${base}/${post.id}/restore`,
        headers: headers(),
        payload: { version: 3 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await other.inject({ url: `${base}/${post.id}`, headers: headers() })
    ).json().post,
  ).toMatchObject({ text: "Edited", version: 4, deletedAt: null });
});

it("enforces eleven days in storage and permanently purges expired ordinary text", async () => {
  const post = await create();
  await app.inject({
    method: "DELETE",
    url: `${base}/${post.id}`,
    headers: headers(),
    payload: { version: 1 },
  });
  await db.pool.query(
    "UPDATE content_posts SET deleted_at=now()-interval '11 days' WHERE id=$1",
    [post.id],
  );
  expect(
    (
      await app.inject({
        method: "POST",
        url: `${base}/${post.id}/restore`,
        headers: headers(),
        payload: { version: 2 },
      })
    ).statusCode,
  ).toBe(410);
  await db.content.purgeExpired();
  expect(
    (await db.pool.query("SELECT id FROM content_posts WHERE id=$1", [post.id]))
      .rowCount,
  ).toBe(0);
});

it("paginates tied timestamps deterministically without crossing author boundaries", async () => {
  const ids: string[] = [];
  for (let i = 0; i < 22; i++) ids.push((await create()).id);
  await db.pool.query(
    "UPDATE content_posts SET created_at='2030-01-01T00:00:00.123456Z' WHERE id=ANY($1::uuid[])",
    [ids],
  );
  const first = (await app.inject({ url: base, headers: headers() })).json();
  expect(first.posts.map((p: { id: string }) => p.id)).toEqual(
    [...ids].sort().reverse().slice(0, 20),
  );
  expect(first.nextCursor.at).toBe("2030-01-01T00:00:00.123456Z");
  const params = new URLSearchParams({
    afterTime: first.nextCursor.at,
    afterId: first.nextCursor.id,
  });
  const second = (
    await other.inject({ url: `${base}?${params}`, headers: headers() })
  ).json();
  const seen = [...first.posts, ...second.posts].filter((p: { id: string }) =>
    ids.includes(p.id),
  );
  expect(seen.map((p: { id: string }) => p.id)).toEqual(
    [...ids].sort().reverse(),
  );
  expect(
    (
      await app.inject({
        url: `${base}?afterTime=2030-01-01T00:00:00Z`,
        headers: headers(),
      })
    ).statusCode,
  ).toBe(400);
});
