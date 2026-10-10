import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createActivities } from "../../packages/activities/src/index";
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
  throw new Error("Activities tests require local vq_test");
const db = createDatabase(url);
const origin = "http://127.0.0.1:3000";
const root = await mkdtemp(path.join(tmpdir(), "vq-activities-"));
const options = {
  identity: db.identity,
  profiles: db.profiles,
  activities: db.activities,
  media: db.media,
  mediaRoot: root,
  allowedOrigins: [origin],
};
const app = buildApi(db.repository, options);
const people: { id: string; cookie: string }[] = [];
const input = {
  title: "Tea exchange fixture",
  description: "A real persisted casual gathering",
  location: "Medina, Tunis",
  emoji: "🍵",
  startsAt: null,
  mediaIds: [],
};
let id = "";
beforeAll(async () => {
  await migrate(db.pool);
  for (let i = 0; i < 2; i++) {
    const result = await app.inject({
      method: "POST",
      url: "/v1/identity/register",
      headers: { origin },
      remoteAddress: `127.0.0.${110 + i}`,
      payload: {
        email: `activities-${randomUUID()}@example.test`,
        password: "Real-activities-fixture!83",
      },
    });
    expect(result.statusCode).toBe(201);
    people.push({
      id: result.json().account.id,
      cookie: String(result.headers["set-cookie"]).split(";")[0],
    });
  }
});
afterAll(async () => {
  if (
    (await db.pool.query("SELECT to_regclass('activities_entries') AS name"))
      .rows[0].name
  )
    await db.pool.query(
      "DELETE FROM activities_entries WHERE owner_id=ANY($1::uuid[])",
      [people.map((p) => p.id)],
    );
  await db.pool.query("DELETE FROM identity_users WHERE id=ANY($1::uuid[])", [
    people.map((p) => p.id),
  ]);
  await db.pool.query(
    "DELETE FROM activities_media_retirements WHERE user_id=ANY($1::uuid[])",
    [people.map((p) => p.id)],
  );
  await db.pool.query(
    "DELETE FROM media_cleanup_jobs WHERE owner_id=ANY($1::uuid[])",
    [people.map((p) => p.id)],
  );
  await app.close();
  await db.close();
  await rm(root, { recursive: true, force: true });
});
const post = (payload: unknown, cookie?: string) =>
  app.inject({
    method: "POST",
    url: "/v1/activities",
    headers: { origin, ...(cookie ? { cookie } : {}) },
    payload: payload as object,
  });
it("allows public reads but requires a real completed profile to publish", async () => {
  expect(
    (await app.inject({ url: "/v1/activities?tab=live" })).statusCode,
  ).toBe(200);
  expect((await post(input)).statusCode).toBe(401);
  expect((await post(input, people[0].cookie)).statusCode).toBe(403);
  const profile = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie: people[0].cookie },
    payload: {
      name: "Activity reporter",
      bio: "Real fixture biography",
      handle: null,
      favoriteVibe: "Cozy",
      version: 0,
    },
  });
  expect(profile.statusCode).toBe(200);
  expect(
    (await post({ ...input, ownerId: people[1].id }, people[0].cookie))
      .statusCode,
  ).toBe(400);
  const created = await post(input, people[0].cookie);
  expect(created.statusCode).toBe(201);
  id = created.json().activity.id;
  expect(created.json().activity).toMatchObject({
    ownerId: people[0].id,
    status: "live",
    title: input.title,
  });
  const secondDb = createDatabase(url!);
  const second = buildApi(secondDb.repository, {
    ...options,
    identity: secondDb.identity,
    profiles: secondDb.profiles,
    activities: secondDb.activities,
  });
  try {
    expect(
      (await second.inject({ url: `/v1/activities/${id}` })).json().activity.id,
    ).toBe(id);
  } finally {
    await second.close();
    await secondDb.close();
  }
});
it("validates schedules and attachments without persisting rejected creations", async () => {
  expect(
    (
      await post(
        { ...input, startsAt: new Date(Date.now() - 60000).toISOString() },
        people[0].cookie,
      )
    ).statusCode,
  ).toBe(422);
  expect(
    (await post({ ...input, mediaIds: [randomUUID()] }, people[0].cookie))
      .statusCode,
  ).toBe(422);
  const future = new Date(Date.now() + 3600000).toISOString();
  const created = await post(
    { ...input, title: "Scheduled fixture", startsAt: future },
    people[0].cookie,
  );
  expect(created.statusCode).toBe(201);
  expect(
    (await app.inject({ url: "/v1/activities?tab=upcoming" }))
      .json()
      .activities.some(
        (a: { id: string }) => a.id === created.json().activity.id,
      ),
  ).toBe(true);
  expect(
    (await app.inject({ url: "/v1/activities?tab=live" }))
      .json()
      .activities.some(
        (a: { id: string }) => a.id === created.json().activity.id,
      ),
  ).toBe(false);
});
it("enforces owner edits, optimistic versions, cancellation and saves", async () => {
  const edit = (cookie: string, payload: object) =>
    app.inject({
      method: "PUT",
      url: `/v1/activities/${id}`,
      headers: { origin, cookie },
      payload,
    });
  expect(
    (await edit(people[1].cookie, { ...input, version: 1 })).statusCode,
  ).toBe(403);
  expect(
    (
      await edit(people[0].cookie, {
        ...input,
        title: "Edited fixture",
        version: 1,
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await edit(people[0].cookie, { ...input, version: 1 })).statusCode,
  ).toBe(409);
  const saved = await app.inject({
    method: "PUT",
    url: `/v1/activities/${id}/save`,
    headers: { origin, cookie: people[1].cookie },
    payload: { saved: true },
  });
  expect(saved.statusCode).toBe(200);
  expect(
    (
      await app.inject({
        url: `/v1/activities/${id}`,
        headers: { cookie: people[1].cookie },
      })
    ).json().activity.saved,
  ).toBe(true);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/activities/${id}/cancel`,
        headers: { origin, cookie: people[1].cookie },
        payload: { version: 2 },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: `/v1/activities/${id}/cancel`,
        headers: { origin, cookie: people[0].cookie },
        payload: { version: 2 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (await app.inject({ url: `/v1/activities/${id}` })).json().activity.status,
  ).toBe("cancelled");
  expect(
    (await edit(people[0].cookie, { ...input, version: 3 })).statusCode,
  ).toBe(409);
});
it("rolls back a missing attachment and reports malformed JSON as a client error", async () => {
  const before = (
    await db.pool.query(
      "SELECT count(*)::int AS count FROM activities_entries WHERE owner_id=$1",
      [people[0].id],
    )
  ).rows[0].count;
  await expect(
    db.activities.create(people[0].id, "Activity reporter", {
      ...input,
      emoji: "🍵",
      mediaIds: [randomUUID()],
    }),
  ).rejects.toThrow("INVALID_ACTIVITY_MEDIA");
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS count FROM activities_entries WHERE owner_id=$1",
        [people[0].id],
      )
    ).rows[0].count,
  ).toBe(before);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/activities",
        headers: {
          origin,
          cookie: people[0].cookie,
          "content-type": "application/json",
        },
        payload: "{",
      })
    ).statusCode,
  ).toBe(400);
});
it("attaches only owned, ready, public images and retires detached files through Global Media", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
    "base64",
  );
  async function upload(
    cookie: string,
    visibility: "public" | "private",
    bytes = png,
  ) {
    const intent = await app.inject({
      method: "POST",
      url: "/v1/media/uploads",
      headers: { origin, cookie },
      payload: { visibility },
    });
    expect(intent.statusCode).toBe(201);
    const mediaId = intent.json().media.id;
    const result = await app.inject({
      method: "PUT",
      url: `/v1/media/uploads/${mediaId}`,
      headers: { origin, cookie, "content-type": "image/png" },
      payload: bytes,
    });
    return { mediaId, result };
  }
  const own = await upload(people[0].cookie, "public");
  expect(own.result.statusCode).toBe(200);
  const foreign = await upload(people[1].cookie, "public");
  const privateImage = await upload(people[0].cookie, "private");
  const failed = await upload(
    people[0].cookie,
    "public",
    Buffer.from("this is not an image"),
  );
  expect(failed.result.statusCode).toBe(422);
  const before = (
    await db.pool.query(
      "SELECT count(*)::int AS count FROM activities_entries WHERE owner_id=$1",
      [people[0].id],
    )
  ).rows[0].count;
  for (const mediaId of [foreign.mediaId, privateImage.mediaId, failed.mediaId])
    expect(
      (await post({ ...input, mediaIds: [mediaId] }, people[0].cookie))
        .statusCode,
    ).toBe(422);
  expect(
    (
      await db.pool.query(
        "SELECT count(*)::int AS count FROM activities_entries WHERE owner_id=$1",
        [people[0].id],
      )
    ).rows[0].count,
  ).toBe(before);
  const created = await post(
    { ...input, title: "Public image fixture", mediaIds: [own.mediaId] },
    people[0].cookie,
  );
  expect(created.statusCode).toBe(201);
  const activity = created.json().activity;
  const image = await app.inject({ url: `/v1/media/${own.mediaId}/thumbnail` });
  expect(image.statusCode).toBe(200);
  expect(image.headers["content-type"]).toContain("image/webp");
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/media/${own.mediaId}`,
        headers: { origin, cookie: people[0].cookie },
      })
    ).statusCode,
  ).toBe(409);
  const edited = await app.inject({
    method: "PUT",
    url: `/v1/activities/${activity.id}`,
    headers: { origin, cookie: people[0].cookie },
    payload: { ...input, version: 1 },
  });
  expect(edited.statusCode).toBe(200);
  expect(
    (
      await db.pool.query(
        "SELECT media_id FROM activities_media_retirements WHERE media_id=$1",
        [own.mediaId],
      )
    ).rowCount,
  ).toBe(1);
  const media = createMedia(
    db.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  await createActivities(
    db.activities,
    db.profiles,
    media,
  ).cleanupAttachments();
  expect(
    (await app.inject({ url: `/v1/media/${own.mediaId}/thumbnail` }))
      .statusCode,
  ).toBe(404);
});
it("persists authenticated upcoming reviews and computes lifecycle from the server clock", async () => {
  const created = await post(
    {
      ...input,
      title: "Reviewed scheduled fixture",
      startsAt: new Date(Date.now() + 3600000).toISOString(),
    },
    people[0].cookie,
  );
  const activity = created.json().activity;
  const endpoint = `/v1/activities/${activity.id}/reviews`;
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin },
        payload: { rating: 5, text: "Fixture review" },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[0].cookie },
        payload: { rating: 0, text: "Fixture" },
      })
    ).statusCode,
  ).toBe(400);
  expect(
    (
      await app.inject({
        method: "POST",
        url: endpoint,
        headers: { origin, cookie: people[0].cookie },
        payload: { rating: 4, text: "Persisted review" },
      })
    ).statusCode,
  ).toBe(201);
  expect((await app.inject({ url: endpoint })).json().reviews[0]).toMatchObject(
    { author: "Activity reporter", rating: 4, text: "Persisted review" },
  );
  expect(
    (await app.inject({ url: `/v1/activities/${activity.id}` })).json()
      .activity,
  ).toMatchObject({ reviewCount: 1, rating: 4 });
  // Move only this isolated fixture across the start boundary; no production lifecycle simulation.
  await db.pool.query(
    "UPDATE activities_entries SET starts_at=now()-interval '1 minute' WHERE id=$1",
    [activity.id],
  );
  expect(
    (await app.inject({ url: `/v1/activities/${activity.id}` })).json().activity
      .status,
  ).toBe("live");
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/activities/${activity.id}`,
        headers: { origin, cookie: people[0].cookie },
        payload: {
          ...input,
          startsAt: new Date(Date.now() + 7200000).toISOString(),
          version: 1,
        },
      })
    ).statusCode,
  ).toBe(422);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/activities",
        headers: {
          origin: "https://untrusted.example",
          cookie: people[0].cookie,
        },
        payload: input,
      })
    ).statusCode,
  ).toBe(403);
});
