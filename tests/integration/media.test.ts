import { randomUUID } from "node:crypto";
import {
  mkdtemp,
  rm,
  readdir,
  writeFile,
  mkdir,
  rmdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";
import { createProfiles } from "../../packages/profile/src/index";
import { createMedia } from "../../packages/media/src/index";
import { createLocalMediaStorage } from "../../apps/api/src/modules/media/infrastructure/local-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Media tests require local vq_test.");
const database = createDatabase(url);
const root = await mkdtemp(path.join(tmpdir(), "vq-media-"));
const app = buildApi(database.repository, {
  identity: database.identity,
  profiles: database.profiles,
  media: database.media,
  mediaRoot: root,
  allowedOrigins: ["http://127.0.0.1:3000"],
});
const email = `media-${randomUUID()}@example.test`;
const origin = "http://127.0.0.1:3000";
let cookie = "";
let id = "";
// A genuine PNG test fixture, never inserted as production activity/camera proof.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
  "base64",
);

beforeAll(async () => {
  await migrate(database.pool);
  const user = await app.inject({
    method: "POST",
    url: "/v1/identity/register",
    headers: { origin },
    remoteAddress: "127.0.0.42",
    payload: { email, password: "Media-integration-account!79" },
  });
  expect(user.statusCode).toBe(201);
  cookie = String(user.headers["set-cookie"]).split(";")[0];
});
afterAll(async () => {
  try {
    const owner = (
      await database.pool.query(
        "SELECT user_id FROM identity_password_accounts WHERE email=$1",
        [email],
      )
    ).rows[0]?.user_id;
    await database.pool.query(
      "DELETE FROM identity_users WHERE id IN (SELECT user_id FROM identity_password_accounts WHERE email=$1)",
      [email],
    );
    if (owner) {
      const media = createMedia(
        database.media,
        createLocalMediaStorage(root),
        imageProcessor,
      );
      for (const row of (
        await database.pool.query(
          "SELECT object_id FROM media_cleanup_jobs WHERE owner_id=$1 AND completed_at IS NULL",
          [owner],
        )
      ).rows)
        await media.remove(owner, row.object_id);
      expect(
        (
          await database.pool.query(
            "SELECT object_id FROM media_cleanup_jobs WHERE owner_id=$1 AND completed_at IS NULL",
            [owner],
          )
        ).rowCount,
      ).toBe(0);
    }
  } finally {
    await app.close();
    await database.close();
    await rm(root, { recursive: true, force: true });
  }
});

it("requires authentication before issuing an upload session", async () => {
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/media/uploads",
        headers: { origin },
        payload: { visibility: "private" },
      })
    ).statusCode,
  ).toBe(401);
});

it("rejects unsupported upload content types without reporting a service outage", async () => {
  const intent = await app.inject({
    method: "POST",
    url: "/v1/media/uploads",
    headers: { origin, cookie },
    payload: { visibility: "private" },
  });
  const response = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${intent.json().media.id}`,
    headers: { origin, cookie, "content-type": "text/plain" },
    payload: "not an image",
  });
  expect(response.statusCode).toBe(415);
});
it("writes validated image bytes and returns a genuine optimized image", async () => {
  const session = await app.inject({
    method: "POST",
    url: "/v1/media/uploads",
    headers: { origin, cookie },
    payload: { visibility: "private" },
  });
  expect(session.statusCode).toBe(201);
  id = session.json().media.id;
  const upload = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${id}`,
    headers: { origin, cookie, "content-type": "image/png" },
    payload: png,
  });
  expect(upload.statusCode).toBe(200);
  expect(upload.json().media).toMatchObject({
    status: "ready",
    width: 1,
    height: 1,
  });
  const image = await app.inject({
    url: `/v1/media/${id}/image`,
    headers: { cookie },
  });
  expect(image.statusCode).toBe(200);
  expect(image.headers["content-type"]).toContain("image/webp");
  expect(image.rawPayload.subarray(8, 12).toString()).toBe("WEBP");
  expect(
    (
      await app.inject({
        url: `/v1/media/${id}/thumbnail`,
        headers: { cookie },
      })
    ).statusCode,
  ).toBe(200);
});
it("does not expose private media or permit a second upload", async () => {
  expect((await app.inject(`/v1/media/${id}/image`)).statusCode).toBe(404);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/media/uploads/${id}`,
        headers: { origin, cookie, "content-type": "image/png" },
        payload: png,
      })
    ).statusCode,
  ).toBe(409);
});
it("records corrupt-image failure without manufacturing a ready object", async () => {
  const session = await app.inject({
    method: "POST",
    url: "/v1/media/uploads",
    headers: { origin, cookie },
    payload: { visibility: "private" },
  });
  const failedId = session.json().media.id;
  const upload = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${failedId}`,
    headers: { origin, cookie, "content-type": "image/png" },
    payload: Buffer.from("not a PNG"),
  });
  expect(upload.statusCode).toBe(422);
  expect(
    (
      await database.pool.query(
        "SELECT status FROM media_objects WHERE id=$1",
        [failedId],
      )
    ).rows[0].status,
  ).toBe("failed");
});
it("deletes physical variants and prevents retrieval", async () => {
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/media/${id}`,
        headers: { origin, cookie },
      })
    ).statusCode,
  ).toBe(204);
  expect(
    (await app.inject({ url: `/v1/media/${id}/image`, headers: { cookie } }))
      .statusCode,
  ).toBe(404);
  expect((await readdir(root)).filter((file) => file.startsWith(id))).toEqual(
    [],
  );
});

it("attaches only owned ready media and protects it until the profile detaches", async () => {
  const profile = await app.inject({
    method: "PUT",
    url: "/v1/profile/me",
    headers: { origin, cookie },
    payload: {
      name: "Media test",
      bio: "Attachment test",
      handle: null,
      favoriteVibe: "Cozy",
      version: 0,
    },
  });
  expect(profile.statusCode).toBe(200);
  const invalid = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: randomUUID(), version: 1 },
  });
  expect(invalid.statusCode).toBe(422);
  const session = await app.inject({
    method: "POST",
    url: "/v1/media/uploads",
    headers: { origin, cookie },
    payload: { visibility: "private" },
  });
  const photoId = session.json().media.id;
  expect(
    (
      await app.inject({
        method: "PUT",
        url: `/v1/media/uploads/${photoId}`,
        headers: { origin, cookie, "content-type": "image/png" },
        payload: png,
      })
    ).statusCode,
  ).toBe(200);
  const attach = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: photoId, version: 1 },
  });
  expect(attach.statusCode).toBe(200);
  expect(attach.json().profile.photoMediaId).toBe(photoId);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/media/${photoId}`,
        headers: { origin, cookie },
      })
    ).statusCode,
  ).toBe(409);
  expect(
    (
      await app.inject({
        method: "PUT",
        url: "/v1/profile/photo",
        headers: { origin, cookie },
        payload: { mediaId: null, version: 2 },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        method: "DELETE",
        url: `/v1/media/${photoId}`,
        headers: { origin, cookie },
      })
    ).statusCode,
  ).toBe(204);
});

it("durably retires replaced photos without deleting the current attachment", async () => {
  async function photo() {
    const intent = await app.inject({
      method: "POST",
      url: "/v1/media/uploads",
      headers: { origin, cookie },
      payload: { visibility: "private" },
    });
    const photoId = intent.json().media.id as string;
    const upload = await app.inject({
      method: "PUT",
      url: `/v1/media/uploads/${photoId}`,
      headers: { origin, cookie, "content-type": "image/png" },
      payload: png,
    });
    expect(upload.statusCode).toBe(200);
    return photoId;
  }
  const previous = await photo();
  const current = await photo();
  const existing = (
    await app.inject({ url: "/v1/profile/me", headers: { cookie } })
  ).json().profile;
  const first = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: previous, version: existing.version },
  });
  expect(first.statusCode).toBe(200);
  const stale = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: current, version: existing.version },
  });
  expect(stale.statusCode).toBe(409);
  expect(
    (
      await database.pool.query(
        "SELECT media_id FROM profile_photo_retirements WHERE media_id=$1",
        [previous],
      )
    ).rowCount,
  ).toBe(0);
  const second = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: current, version: first.json().profile.version },
  });
  expect(second.statusCode).toBe(200);
  // A freshly composed worker proves the retirement survives the request instance.
  const media = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  const profiles = createProfiles(database.profiles, media);
  await profiles.cleanupPhotos();
  expect(await database.media.read(previous)).toBeNull();
  expect(
    (await readdir(root)).filter((file) => file.startsWith(previous)),
  ).toEqual([]);
  expect((await database.media.read(current))?.status).toBe("ready");
  expect((await database.profiles.read(existing.userId))?.photoMediaId).toBe(
    current,
  );
  await profiles.cleanupPhotos();
  expect((await database.media.read(current))?.status).toBe("ready");
  const detached = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: null, version: second.json().profile.version },
  });
  expect(detached.statusCode).toBe(200);
  const reattached = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: current, version: detached.json().profile.version },
  });
  expect(reattached.statusCode).toBe(200);
  await profiles.cleanupPhotos();
  expect((await database.media.read(current))?.status).toBe("ready");
  expect((await database.profiles.read(existing.userId))?.photoMediaId).toBe(
    current,
  );
});

it("retains durable cleanup work and backs off after a real filesystem failure", async () => {
  const existing = (
    await app.inject({ url: "/v1/profile/me", headers: { cookie } })
  ).json().profile;
  const photoId = existing.photoMediaId as string;
  expect(photoId).toBeTruthy();
  const detach = await app.inject({
    method: "PUT",
    url: "/v1/profile/photo",
    headers: { origin, cookie },
    payload: { mediaId: null, version: existing.version },
  });
  expect(detach.statusCode).toBe(200);
  // An actual file where a directory is required causes genuine ENOTDIR.
  const blocked = path.join(root, "not-a-storage-directory");
  await writeFile(blocked, "Filesystem failure fixture");
  const unavailable = createMedia(
    database.media,
    createLocalMediaStorage(blocked),
    imageProcessor,
  );
  await createProfiles(database.profiles, unavailable).cleanupPhotos();
  const job = await database.pool.query(
    "SELECT attempts,next_attempt_at>now() AS deferred FROM profile_photo_retirements WHERE media_id=$1",
    [photoId],
  );
  expect(job.rows[0]).toMatchObject({ attempts: 1, deferred: true });
  expect(
    (
      await database.pool.query(
        "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
        [photoId],
      )
    ).rows[0].completed_at,
  ).toBeNull();
  expect((await readdir(root)).some((file) => file.startsWith(photoId))).toBe(
    true,
  );
  await database.pool.query(
    "UPDATE profile_photo_retirements SET next_attempt_at=now() WHERE media_id=$1",
    [photoId],
  );
  const recovered = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  await createProfiles(database.profiles, recovered).cleanupPhotos();
  expect(
    (await readdir(root)).filter((file) => file.startsWith(photoId)),
  ).toEqual([]);
  expect(
    (
      await database.pool.query(
        "SELECT media_id FROM profile_photo_retirements WHERE media_id=$1",
        [photoId],
      )
    ).rowCount,
  ).toBe(0);
});

it("expires abandoned intents while preserving active processing and ready images", async () => {
  const user = (
    await app.inject({ url: "/v1/identity/me", headers: { cookie } })
  ).json().account;
  const pending = await database.media.create(user.id, "private");
  const failed = await database.media.create(user.id, "private");
  const processing = await database.media.create(user.id, "private");
  const ready = await database.media.create(user.id, "private");
  expect(await database.media.claim(processing.id, user.id)).toBe(true);
  expect(await database.media.claim(failed.id, user.id)).toBe(true);
  await database.media.fail(failed.id);
  const upload = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${ready.id}`,
    headers: { origin, cookie, "content-type": "image/png" },
    payload: png,
  });
  expect(upload.statusCode).toBe(200);
  await database.pool.query(
    "UPDATE media_objects SET expires_at=now()-interval '1 second' WHERE id=ANY($1::uuid[])",
    [[pending.id, failed.id, processing.id, ready.id]],
  );
  const media = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  await media.cleanup();
  expect(await database.media.read(pending.id)).toBeNull();
  expect(await database.media.read(failed.id)).toBeNull();
  expect((await database.media.read(processing.id))?.status).toBe("processing");
  expect((await database.media.read(ready.id))?.status).toBe("ready");
});

it("defers one failed deletion without blocking other physical cleanup jobs", async () => {
  const user = (
    await app.inject({ url: "/v1/identity/me", headers: { cookie } })
  ).json().account;
  const blocked = await database.media.create(user.id, "private");
  const healthy = await database.media.create(user.id, "private");
  const directory = path.join(root, `${blocked.id}-image.webp`);
  await mkdir(directory);
  const uploaded = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${healthy.id}`,
    headers: { origin, cookie, "content-type": "image/png" },
    payload: png,
  });
  expect(uploaded.statusCode).toBe(200);
  await database.media.markDeleted(blocked.id, user.id);
  await database.media.markDeleted(healthy.id, user.id);
  const media = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  await media.cleanup();
  const failed = await database.pool.query(
    "SELECT attempts,completed_at,next_attempt_at>now() AS deferred FROM media_cleanup_jobs WHERE object_id=$1",
    [blocked.id],
  );
  expect(failed.rows[0]).toMatchObject({
    attempts: 1,
    completed_at: null,
    deferred: true,
  });
  expect(
    (await readdir(root)).filter((file) => file.startsWith(healthy.id)),
  ).toEqual([]);
  expect(
    (
      await database.pool.query(
        "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
        [healthy.id],
      )
    ).rows[0].completed_at,
  ).not.toBeNull();
  await rmdir(directory);
  await database.pool.query(
    "UPDATE media_cleanup_jobs SET next_attempt_at=now() WHERE object_id=$1",
    [blocked.id],
  );
  await media.cleanup();
  expect(
    (
      await database.pool.query(
        "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
        [blocked.id],
      )
    ).rows[0].completed_at,
  ).not.toBeNull();
});

it("records a failed upload even when removing a partial write also fails", async () => {
  const user = (
    await app.inject({ url: "/v1/identity/me", headers: { cookie } })
  ).json().account;
  const intent = await database.media.create(user.id, "private");
  const blockedThumbnail = path.join(root, `${intent.id}-thumbnail.webp`);
  await mkdir(blockedThumbnail);
  const media = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  await expect(
    media.upload(user.id, intent.id, png, "image/png"),
  ).rejects.toThrow();
  expect((await database.media.read(intent.id))?.status).toBe("failed");
  expect(
    (
      await database.pool.query(
        "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
        [intent.id],
      )
    ).rows[0].completed_at,
  ).toBeNull();
  await rmdir(blockedThumbnail);
  await media.cleanup();
  expect(
    (await readdir(root)).filter((file) => file.startsWith(intent.id)),
  ).toEqual([]);
});

it("bounds concurrent processing without consuming rejected upload intents", async () => {
  const user = (
    await app.inject({ url: "/v1/identity/me", headers: { cookie } })
  ).json().account;
  const intents = await Promise.all(
    Array.from({ length: 4 }, () => database.media.create(user.id, "private")),
  );
  const media = createMedia(
    database.media,
    createLocalMediaStorage(root),
    imageProcessor,
  );
  const results = await Promise.allSettled(
    intents.map((intent) => media.upload(user.id, intent.id, png, "image/png")),
  );
  expect(
    results.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(2);
  const rejected = results.flatMap((result, index) =>
    result.status === "rejected" ? [index] : [],
  );
  expect(rejected).toHaveLength(2);
  for (const index of rejected) {
    const result = results[index];
    if (result.status === "rejected")
      expect(result.reason.code).toBe("MEDIA_BUSY");
    expect((await database.media.read(intents[index].id))?.status).toBe(
      "pending",
    );
    expect(
      (await media.upload(user.id, intents[index].id, png, "image/png")).status,
    ).toBe("ready");
  }
  // A failed decode must release capacity too.
  const invalid = await database.media.create(user.id, "private");
  await expect(
    media.upload(
      user.id,
      invalid.id,
      Buffer.from("invalid image bytes"),
      "image/png",
    ),
  ).rejects.toThrow();
  const later = await database.media.create(user.id, "private");
  expect((await media.upload(user.id, later.id, png, "image/png")).status).toBe(
    "ready",
  );
});

function observeRemoval() {
  const storage = createLocalMediaStorage(root);
  const removed: string[] = [];
  return {
    removed,
    storage: {
      ...storage,
      async remove(objectId: string) {
        removed.push(objectId);
        await storage.remove(objectId);
      },
    },
  };
}
async function uploadFixture() {
  const account = (
    await app.inject({ url: "/v1/identity/me", headers: { cookie } })
  ).json().account;
  const intent = await database.media.create(account.id, "private");
  return { ownerId: account.id as string, id: intent.id };
}

it("preserves both variants and ready metadata after the ready commit response is lost", async () => {
  const fixture = await uploadFixture();
  const observed = observeRemoval();
  const media = createMedia(
    {
      ...database.media,
      async ready(objectId, output) {
        await database.media.ready(objectId, output);
        throw new Error("Ready commit response lost");
      },
    },
    observed.storage,
    imageProcessor,
  );
  await expect(
    media.upload(fixture.ownerId, fixture.id, png, "image/png"),
  ).rejects.toThrow("Ready commit response lost");
  expect((await database.media.read(fixture.id))?.status).toBe("ready");
  expect(observed.removed).toEqual([]);
  for (const variant of ["image", "thumbnail"] as const) {
    const response = await media.retrieve(fixture.id, variant, fixture.ownerId);
    expect(Buffer.from(response.bytes).subarray(8, 12).toString()).toBe("WEBP");
  }
  await media.cleanup();
  expect(observed.removed).toEqual([]);
  for (const variant of ["image", "thumbnail"] as const)
    expect(
      (await media.retrieve(fixture.id, variant, fixture.ownerId)).bytes
        .byteLength,
    ).toBeGreaterThan(0);
});

it("retains real partial-write bytes when failure recording commits but its response is lost", async () => {
  const fixture = await uploadFixture();
  const blocked = path.join(root, fixture.id + "-thumbnail.webp");
  await mkdir(blocked);
  const observed = observeRemoval();
  const media = createMedia(
    {
      ...database.media,
      async fail(objectId) {
        await database.media.fail(objectId);
        throw new Error("Failure commit response lost");
      },
    },
    observed.storage,
    imageProcessor,
  );
  try {
    await expect(
      media.upload(fixture.ownerId, fixture.id, png, "image/png"),
    ).rejects.toThrow();
    expect((await database.media.read(fixture.id))?.status).toBe("failed");
    expect(observed.removed).toEqual([]);
    expect(
      (await observed.storage.read(fixture.id, "image")).byteLength,
    ).toBeGreaterThan(0);
    const job = await database.pool.query(
      "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
      [fixture.id],
    );
    expect(job.rows[0].completed_at).toBeNull();
  } finally {
    await rmdir(blocked);
  }
  await media.cleanup();
  expect(
    (await readdir(root)).filter((file) => file.startsWith(fixture.id)),
  ).toEqual([]);
  const job = await database.pool.query(
    "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
    [fixture.id],
  );
  expect(job.rows[0].completed_at).not.toBeNull();
});

it("authorizes immediate cleanup only after an acknowledged failure transaction", async () => {
  const fixture = await uploadFixture();
  const observed = observeRemoval();
  const media = createMedia(database.media, observed.storage, imageProcessor);
  await expect(
    media.upload(
      fixture.ownerId,
      fixture.id,
      Buffer.from("invalid image bytes"),
      "image/png",
    ),
  ).rejects.toMatchObject({ code: "INVALID_IMAGE" });
  expect((await database.media.read(fixture.id))?.status).toBe("failed");
  expect(observed.removed).toEqual([fixture.id]);
  const job = await database.pool.query(
    "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
    [fixture.id],
  );
  expect(job.rows[0].completed_at).not.toBeNull();
});

it("returns no cleanup authorization when the failure transition changes zero rows", async () => {
  const fixture = await uploadFixture();
  expect(await database.media.fail(fixture.id)).toBe(false);
  expect((await database.media.read(fixture.id))?.status).toBe("pending");
  expect(
    (
      await database.pool.query(
        "SELECT object_id FROM media_cleanup_jobs WHERE object_id=$1",
        [fixture.id],
      )
    ).rowCount,
  ).toBe(0);
});

it("does not remove partial-write bytes when PostgreSQL rejects failure recording", async () => {
  const fixture = await uploadFixture();
  const blocked = path.join(root, fixture.id + "-thumbnail.webp");
  await mkdir(blocked);
  const constraint = "media_failure_" + fixture.id.replaceAll("-", "");
  // Only this disposable fixture is rejected; the real failure SQL must roll back.
  await database.pool.query(
    `ALTER TABLE media_cleanup_jobs ADD CONSTRAINT ${constraint} CHECK (object_id <> '${fixture.id}'::uuid) NOT VALID`,
  );
  const observed = observeRemoval();
  const media = createMedia(database.media, observed.storage, imageProcessor);
  try {
    await expect(
      media.upload(fixture.ownerId, fixture.id, png, "image/png"),
    ).rejects.toMatchObject({ code: "23514" });
    expect(observed.removed).toEqual([]);
    expect((await database.media.read(fixture.id))?.status).toBe("processing");
    expect(
      (await observed.storage.read(fixture.id, "image")).byteLength,
    ).toBeGreaterThan(0);
    expect(
      (
        await database.pool.query(
          "SELECT object_id FROM media_cleanup_jobs WHERE object_id=$1",
          [fixture.id],
        )
      ).rowCount,
    ).toBe(0);
  } finally {
    await database.pool.query(
      `ALTER TABLE media_cleanup_jobs DROP CONSTRAINT ${constraint}`,
    );
    await rmdir(blocked);
  }
});
