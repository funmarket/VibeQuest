import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";
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
  throw new Error("Social tests require local vq_test");
const db = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const root = await mkdtemp(path.join(tmpdir(), "vq-social-"));
const app = buildApi(db.repository, {
  identity: db.identity,
  profiles: db.profiles,
  social: db.social,
  media: db.media,
  mediaRoot: root,
  allowedOrigins: [origin],
});
const people: { id: string; cookie: string; handle: string }[] = [];
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 3; i++) {
    const registered = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${160 + i}`,
      payload: {
        email: `social-${randomUUID()}@example.test`,
        password: "Actual-social-test!91",
      },
    });
    expect(registered.statusCode).toBe(201);
    const person = {
      id: registered.json().account.id,
      cookie: String(registered.headers["set-cookie"]).split(";")[0],
      handle: `social_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    };
    people.push(person);
    expect(
      (
        await app.inject({
          method: "PUT",
          url: "/v1/profile/me",
          headers: { origin, cookie: person.cookie },
          payload: {
            name: `Social ${i}`,
            bio: `Actual biography ${i}`,
            handle: person.handle,
            favoriteVibe: "Cozy",
            version: 0,
          },
        })
      ).statusCode,
    ).toBe(200);
  }
});
afterAll(async () => {
  try {
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      people.map((p) => p.id),
    ]);
    const media = createMedia(
      db.media,
      createLocalMediaStorage(root),
      imageProcessor,
    );
    for (const row of (
      await db.pool.query(
        "SELECT object_id,owner_id FROM media_cleanup_jobs WHERE owner_id=ANY($1::uuid[]) AND completed_at IS NULL",
        [people.map((p) => p.id)],
      )
    ).rows)
      await media.remove(row.owner_id, row.object_id);
  } finally {
    await app.close();
    await db.close();
    await rm(root, { recursive: true, force: true });
  }
});
it("keeps private Profile photographs protected while reading public fields", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
    "base64",
  );
  const headers = { origin, cookie: people[1].cookie };
  const upload = (
    await app.inject({
      method: "POST",
      url: "/v1/media/uploads",
      headers,
      payload: { visibility: "private" },
    })
  ).json().media.id;
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/media/uploads/${upload}`,
        headers: { ...headers, "content-type": "image/png" },
        payload: png,
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/profile/photo",
        headers,
        payload: {
          mediaId: upload,
          version: (await app.inject({ url: "/v1/profile/me", headers })).json()
            .profile.version,
        },
      })
    ).statusCode,
  ).toBe(200);
  const response = await app.inject({
    url: `/v1/public-profiles/handle/${people[1].handle}`,
  });
  expect(Object.keys(response.json().profile).sort()).toEqual([
    "bio",
    "handle",
    "id",
    "name",
  ]);
  expect(response.body).not.toContain(upload);
  expect(
    (await app.inject({ url: `/v1/media/${upload}/thumbnail` })).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        url: `/v1/media/${upload}/thumbnail`,
        headers: { cookie: people[0].cookie },
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (await app.inject({ url: `/v1/media/${upload}/thumbnail`, headers }))
      .statusCode,
  ).toBe(200);
});
it("paginates deterministically without truncating PostgreSQL cursor precision", async () => {
  const ids: string[] = [];
  try {
    for (let i = 0; i < 22; i++) {
      const id = (
        await db.pool.query(
          "INSERT INTO identity_users DEFAULT VALUES RETURNING id",
        )
      ).rows[0].id;
      ids.push(id);
      expect((await follow(0, id)).statusCode).toBe(200);
    }
    await db.pool.query(
      "UPDATE social_follows SET created_at='2026-01-01T00:00:00.123456Z' WHERE follower_id=$1 AND followed_id=ANY($2::uuid[])",
      [people[0].id, ids],
    );
    const first = (
      await app.inject({
        url: "/v1/social/me?side=following",
        headers: { cookie: people[0].cookie },
      })
    ).json();
    expect(first.people).toHaveLength(20);
    expect(first.counts.following).toBe(22);
    const query = new URLSearchParams({
      side: "following",
      afterTime: first.nextCursor.at,
      afterId: first.nextCursor.id,
    });
    const second = (
      await app.inject({
        url: `/v1/social/me?${query}`,
        headers: { cookie: people[0].cookie },
      })
    ).json();
    expect(second.people).toHaveLength(2);
    expect(second.nextCursor).toBeNull();
    expect(
      new Set([...first.people, ...second.people].map((p) => p.profile.id))
        .size,
    ).toBe(22);
  } finally {
    await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
      ids,
    ]);
  }
});
const follow = (actor: number, target: string, following = true, extra = {}) =>
  app.inject({
    method: "PUT",
    url: `/v1/social/users/${target}/follow`,
    headers: { origin, cookie: people[actor].cookie },
    payload: { following, ...extra },
  });
it("projects only public basic fields for guests and reflects Profile updates", async () => {
  const read = () =>
    app.inject({ url: `/v1/public-profiles/handle/${people[1].handle}` });
  const result = await read();
  expect(result.statusCode).toBe(200);
  expect(Object.keys(result.json().profile).sort()).toEqual([
    "bio",
    "handle",
    "id",
    "name",
  ]);
  expect(result.json().profile).toMatchObject({
    id: people[1].id,
    bio: "Actual biography 1",
  });
  const saved = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie: people[1].cookie },
    payload: {
      name: "Updated public name",
      bio: "Updated public biography",
      handle: people[1].handle,
      favoriteVibe: "Cozy",
      version: (
        await app.inject({
          url: "/v1/profile/me",
          headers: { cookie: people[1].cookie },
        })
      ).json().profile.version,
    },
  });
  expect(saved.statusCode).toBe(200);
  expect((await read()).json().profile.name).toBe("Updated public name");
  expect((await read()).json().profile.bio).toBe("Updated public biography");
  expect((await app.inject({ url: "/v1/profile/me" })).statusCode).toBe(401);
});
it("persists following/followers, mutual state and counts across instances", async () => {
  expect((await follow(0, people[1].id)).statusCode).toBe(200);
  expect(
    (
      await app.inject({
        url: "/v1/social/me?side=following",
        headers: { cookie: people[0].cookie },
      })
    ).json().people[0].profile.id,
  ).toBe(people[1].id);
  expect(
    (
      await app.inject({
        url: "/v1/social/me?side=followers",
        headers: { cookie: people[1].cookie },
      })
    ).json().people[0].profile.id,
  ).toBe(people[0].id);
  expect(
    (
      await app.inject({
        url: `/v1/social/users/${people[0].id}`,
        headers: { cookie: people[1].cookie },
      })
    ).json(),
  ).toMatchObject({
    following: false,
    followedBy: true,
    mutual: false,
    counts: { following: 1, followers: 0 },
  });
  expect((await follow(1, people[0].id)).statusCode).toBe(200);
  expect(
    (
      await app.inject({
        url: `/v1/social/users/${people[1].id}`,
        headers: { cookie: people[0].cookie },
      })
    ).json().mutual,
  ).toBe(true);
  expect(
    (
      await db.pool.query(
        "SELECT * FROM social_follows WHERE follower_id=$1 AND followed_id=$2",
        [people[0].id, people[1].id],
      )
    ).rowCount,
  ).toBe(1);
  const other = createDatabase(url!);
  const otherApi = buildApi(other.repository, {
    identity: other.identity,
    profiles: other.profiles,
    social: other.social,
    allowedOrigins: [origin],
  });
  try {
    expect(
      (
        await otherApi.inject({
          url: `/v1/social/users/${people[1].id}`,
          headers: { cookie: people[0].cookie },
        })
      ).json().mutual,
    ).toBe(true);
  } finally {
    await otherApi.close();
    await other.close();
  }
});
it("rejects guest/actor spoof/self/nonexistent targets and prevents concurrent duplicates", async () => {
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/social/users/${people[1].id}/follow`,
        headers: { origin },
        payload: { following: true },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (await follow(0, people[1].id, true, { followerId: people[2].id }))
      .statusCode,
  ).toBe(400);
  expect((await follow(0, people[0].id)).statusCode).toBe(422);
  expect((await follow(0, people[0].id.toUpperCase())).statusCode).toBe(422);
  expect((await follow(0, people[1].id.toUpperCase())).statusCode).toBe(200);
  expect((await follow(0, randomUUID())).statusCode).toBe(404);
  expect(
    (
      await app.inject({
        url: "/v1/public-profiles/handle/missing_social_user",
      })
    ).statusCode,
  ).toBe(404);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/social/users/${people[1].id}/follow`,
        headers: {
          origin: "https://foreign.example",
          cookie: people[0].cookie,
        },
        payload: { following: true },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/social/users/${people[1].id}/follow`,
        headers: {
          origin,
          cookie: people[0].cookie,
          "content-type": "application/json",
        },
        payload: "{invalid",
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        url: `/v1/social/me?side=following&afterId=${people[1].id}`,
        headers: { cookie: people[0].cookie },
      })
    ).statusCode,
  ).toBe(400);
  const results = await Promise.all(
    Array.from({ length: 8 }, () => follow(0, people[1].id)),
  );
  expect(results.every((r) => r.statusCode === 200)).toBe(true);
  expect(
    (
      await db.pool.query(
        "SELECT * FROM social_follows WHERE follower_id=$1 AND followed_id=$2",
        [people[0].id, people[1].id],
      )
    ).rowCount,
  ).toBe(1);
  const mixed = await Promise.all(
    Array.from({ length: 8 }, (_, i) => follow(0, people[1].id, i % 2 === 0)),
  );
  expect(mixed.every((r) => r.statusCode === 200)).toBe(true);
  expect((await follow(0, people[1].id, false)).statusCode).toBe(200);
  expect((await follow(0, people[1].id, false)).statusCode).toBe(200);
  expect(
    (
      await app.inject({
        url: "/v1/social/me?side=following",
        headers: { cookie: people[0].cookie },
      })
    ).json().people,
  ).toEqual([]);
  const followers = (
    await app.inject({
      url: "/v1/social/me?side=followers",
      headers: { cookie: people[1].cookie },
    })
  ).json();
  expect(followers.people).toEqual([]);
  expect(followers.counts.followers).toBe(0);
});
it("hides unavailable accounts and cascades canonical account deletion", async () => {
  await follow(0, people[2].id);
  await db.pool.query(
    "UPDATE identity_users SET disabled_at=now() WHERE id=$1",
    [people[2].id],
  );
  expect((await follow(0, people[2].id)).statusCode).toBe(404);
  expect((await follow(2, people[0].id)).statusCode).toBe(401);
  expect(
    (
      await app.inject({
        url: `/v1/public-profiles/handle/${people[2].handle}`,
      })
    ).statusCode,
  ).toBe(404);
  const list = (
    await app.inject({
      url: "/v1/social/me?side=following",
      headers: { cookie: people[0].cookie },
    })
  ).json();
  expect(list.people).toEqual([]);
  expect(list.counts.following).toBe(0);
  await db.pool.query("DELETE FROM identity_users WHERE id=$1", [people[2].id]);
  expect(
    (
      await db.pool.query("SELECT * FROM social_follows WHERE followed_id=$1", [
        people[2].id,
      ])
    ).rowCount,
  ).toBe(0);
});
