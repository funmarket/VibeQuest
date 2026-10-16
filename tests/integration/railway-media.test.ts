import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { createMedia } from "../../packages/media/src/index";
import { buildApi } from "../../apps/api/src/app";
import { createRailwayMediaStorage } from "../../apps/api/src/modules/media/infrastructure/railway-storage";
import { imageProcessor } from "../../apps/api/src/modules/media/infrastructure/image-processor";

const url = process.env.TEST_DATABASE_URL;
if (
  !url ||
  new URL(url).pathname !== "/vq_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Railway Media tests require local vq_test.");
const database = createDatabase(url);
const objects = new Map<string, Buffer>();
let intercept:
  | ((method: string, key: string, response: ServerResponse) => boolean)
  | undefined;
const server = createServer(async (request, response) => {
  const key = (request.url ?? "").split("?")[0];
  const method = request.method ?? "";
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (intercept?.(method, key, response)) return;
  if (method === "PUT") {
    objects.set(key, Buffer.concat(chunks));
    response.end();
  } else if (method === "GET" && objects.has(key))
    response.end(objects.get(key));
  else if (method === "DELETE") {
    objects.delete(key);
    response.writeHead(204).end();
  } else {
    response.writeHead(404, { "content-type": "application/xml" });
    response.end("<Error><Code>NoSuchKey</Code></Error>");
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string")
  throw new Error("No fixture address");
const storage = createRailwayMediaStorage({
  backend: "railway",
  endpoint: `http://127.0.0.1:${address.port}`,
  region: "auto",
  bucket: "vq-media-test",
  forcePathStyle: true,
  credentials: { accessKeyId: "test-key", secretAccessKey: "test-secret" },
});
const origin = "http://127.0.0.1:3000";
const app = buildApi(database.repository, {
  identity: database.identity,
  profiles: database.profiles,
  media: database.media,
  mediaStorage: storage,
  allowedOrigins: [origin],
});
const email = `railway-media-${randomUUID()}@example.test`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWMQ2NkIAAInAUsQFDrHAAAAAElFTkSuQmCC",
  "base64",
);
let ownerId: string;
let cookie: string;
beforeAll(async () => {
  await migrate(database.pool);
  const registration = await app.inject({
    method: "POST",
    url: "/v1/identity/register",
    headers: { origin },
    payload: { email, password: "Railway-media-integration!79" },
    remoteAddress: "127.0.0.43",
  });
  expect(registration.statusCode).toBe(201);
  cookie = String(registration.headers["set-cookie"]).split(";")[0];
  ownerId = registration.json().account.id;
});
afterAll(async () => {
  intercept = undefined;
  try {
    await database.pool.query("DELETE FROM identity_users WHERE id=$1", [
      ownerId,
    ]);
    const media = createMedia(database.media, storage, imageProcessor);
    for (const { object_id: id } of (
      await database.pool.query(
        "SELECT object_id FROM media_cleanup_jobs WHERE owner_id=$1 AND completed_at IS NULL",
        [ownerId],
      )
    ).rows)
      await media.remove(ownerId, id);
  } finally {
    await app.close();
    await database.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
async function upload(visibility: "public" | "private") {
  const intent = await database.media.create(ownerId, visibility);
  const response = await app.inject({
    method: "PUT",
    url: `/v1/media/uploads/${intent.id}`,
    headers: { origin, cookie, "content-type": "image/png" },
    payload: png,
  });
  expect(response.statusCode).toBe(200);
  return intent.id;
}

it("uses injected bucket storage for authenticated upload and authorized HTTP delivery", async () => {
  const privateId = await upload("private");
  expect((await app.inject(`/v1/media/${privateId}/image`)).statusCode).toBe(
    404,
  );
  const privateImage = await app.inject({
    url: `/v1/media/${privateId}/image`,
    headers: { cookie },
  });
  expect(privateImage.statusCode).toBe(200);
  expect(privateImage.headers["cache-control"]).toBe("private, no-store");
  expect(privateImage.rawPayload.subarray(8, 12).toString()).toBe("WEBP");
  const publicId = await upload("public");
  const publicImage = await app.inject(`/v1/media/${publicId}/thumbnail`);
  expect(publicImage.statusCode).toBe(200);
  expect(publicImage.headers["cache-control"]).toBe("public, max-age=60");
  const media = createMedia(database.media, storage, imageProcessor);
  expect(await media.canAttachPublic(ownerId, publicId)).toBe(true);
  expect(await media.canAttachPublic(randomUUID(), publicId)).toBe(false);
  expect(await media.canAttachPublic(ownerId, privateId)).toBe(false);
  objects.delete(`/vq-media-test/media/${publicId}/image.webp`);
  expect((await app.inject(`/v1/media/${publicId}/image`)).statusCode).toBe(
    404,
  );
});

it("keeps processing state until the bucket acknowledges the thumbnail", async () => {
  const intent = await database.media.create(ownerId, "public");
  let acknowledge!: () => void;
  let received!: () => void;
  const incoming = new Promise<void>((resolve) => {
    received = resolve;
  });
  intercept = (method, key, response) => {
    if (method !== "PUT" || !key.endsWith(`${intent.id}/thumbnail.webp`))
      return false;
    acknowledge = () => response.end();
    received();
    return true;
  };
  const media = createMedia(database.media, storage, imageProcessor);
  const writing = media.upload(ownerId, intent.id, png, "image/png");
  try {
    await incoming;
    expect((await database.media.read(intent.id))?.status).toBe("processing");
  } finally {
    acknowledge();
    intercept = undefined;
  }
  expect((await writing).status).toBe("ready");
});

it("persists cleanup retry after partial bucket deletion failure", async () => {
  const id = await upload("public");
  const media = createMedia(database.media, storage, imageProcessor);
  await database.media.markDeleted(id, ownerId);
  intercept = (method, key, response) => {
    if (method !== "DELETE" || !key.endsWith(`${id}/thumbnail.webp`))
      return false;
    response.writeHead(403, { "content-type": "application/xml" });
    response.end("<Error><Code>AccessDenied</Code></Error>");
    return true;
  };
  try {
    await media.cleanup();
    expect(
      (
        await database.pool.query(
          "SELECT completed_at, attempts, next_attempt_at>now() AS deferred FROM media_cleanup_jobs WHERE object_id=$1",
          [id],
        )
      ).rows[0],
    ).toMatchObject({ completed_at: null, attempts: 1, deferred: true });
    expect(objects.has(`/vq-media-test/media/${id}/thumbnail.webp`)).toBe(true);
  } finally {
    intercept = undefined;
  }
  await database.pool.query(
    "UPDATE media_cleanup_jobs SET next_attempt_at=now() WHERE object_id=$1",
    [id],
  );
  await media.cleanup();
  expect(objects.has(`/vq-media-test/media/${id}/thumbnail.webp`)).toBe(false);
  expect(
    (
      await database.pool.query(
        "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
        [id],
      )
    ).rows[0].completed_at,
  ).not.toBeNull();
});

it("preserves committed ready bytes when the database acknowledgement is lost", async () => {
  const intent = await database.media.create(ownerId, "private");
  const media = createMedia(
    {
      ...database.media,
      async ready(id, output) {
        await database.media.ready(id, output);
        throw new Error("Ready response lost");
      },
    },
    storage,
    imageProcessor,
  );
  await expect(
    media.upload(ownerId, intent.id, png, "image/png"),
  ).rejects.toThrow("Ready response lost");
  expect((await database.media.read(intent.id))?.status).toBe("ready");
  await media.cleanup();
  for (const variant of ["image", "thumbnail"] as const)
    expect(
      (await media.retrieve(intent.id, variant, ownerId)).bytes.byteLength,
    ).toBeGreaterThan(0);
});

it("retains partial bytes after lost failure acknowledgement for durable cleanup", async () => {
  const intent = await database.media.create(ownerId, "private");
  intercept = (method, key, response) => {
    if (method !== "PUT" || !key.endsWith(`${intent.id}/thumbnail.webp`))
      return false;
    response.writeHead(403, { "content-type": "application/xml" });
    response.end("<Error><Code>AccessDenied</Code></Error>");
    return true;
  };
  const media = createMedia(
    {
      ...database.media,
      async fail(id) {
        await database.media.fail(id);
        throw new Error("Failure response lost");
      },
    },
    storage,
    imageProcessor,
  );
  try {
    await expect(
      media.upload(ownerId, intent.id, png, "image/png"),
    ).rejects.toThrow("Failure response lost");
    expect((await database.media.read(intent.id))?.status).toBe("failed");
    expect(objects.has(`/vq-media-test/media/${intent.id}/image.webp`)).toBe(
      true,
    );
    expect(
      (
        await database.pool.query(
          "SELECT completed_at FROM media_cleanup_jobs WHERE object_id=$1",
          [intent.id],
        )
      ).rows[0].completed_at,
    ).toBeNull();
  } finally {
    intercept = undefined;
  }
  await media.cleanup();
  expect(objects.has(`/vq-media-test/media/${intent.id}/image.webp`)).toBe(
    false,
  );
});
