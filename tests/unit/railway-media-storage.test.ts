import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createRailwayMediaStorage } from "../../apps/api/src/modules/media/infrastructure/railway-storage";

const id = "d9428888-122b-4f4e-8a7b-9a0a1a2a3a4a";
const objects = new Map<string, Buffer>();
let requests: { method: string; path: string; contentType?: string }[];
let failure:
  | ((method: string, key: string, response: ServerResponse) => boolean)
  | undefined;
function s3Error(response: ServerResponse, code: string, status = 403) {
  response.writeHead(status, { "content-type": "application/xml" });
  response.end(
    `<Error><Code>${code}</Code><Message>Storage fixture error</Message></Error>`,
  );
}
const server = createServer(async (request, response) => {
  const key = (request.url ?? "").split("?")[0];
  const method = request.method ?? "";
  requests.push({
    method,
    path: key,
    contentType: request.headers["content-type"],
  });
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (failure?.(method, key, response)) return;
  if (method === "PUT") {
    objects.set(key, Buffer.concat(chunks));
    response.end();
  } else if (method === "GET") {
    const body = objects.get(key);
    if (!body) s3Error(response, "NoSuchKey", 404);
    else {
      response.setHeader("content-type", "image/webp");
      response.end(body);
    }
  } else if (method === "DELETE") {
    objects.delete(key);
    response.writeHead(204).end();
  } else s3Error(response, "InvalidRequest", 400);
});
let storage: ReturnType<typeof createRailwayMediaStorage>;
beforeEach(async () => {
  objects.clear();
  requests = [];
  failure = undefined;
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No fixture address");
  storage = createRailwayMediaStorage({
    backend: "railway",
    endpoint: `http://127.0.0.1:${address.port}`,
    region: "auto",
    bucket: "vq-media-example",
    forcePathStyle: true,
    credentials: { accessKeyId: "test-key", secretAccessKey: "test-secret" },
  });
});
afterEach(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

it.each(["image", "thumbnail"] as const)(
  "round-trips actual %s bytes through the SDK and configured endpoint/bucket",
  async (variant) => {
    const bytes = new Uint8Array([0, 1, 127, 255]);
    await storage.write(id, variant, bytes);
    expect(await storage.read(id, variant)).toEqual(bytes);
    expect(requests.map(({ method, path }) => ({ method, path }))).toEqual([
      { method: "PUT", path: `/vq-media-example/media/${id}/${variant}.webp` },
      { method: "GET", path: `/vq-media-example/media/${id}/${variant}.webp` },
    ]);
    expect(requests[0].contentType).toBe("image/webp");
  },
);

it("does not resolve a write before the service acknowledges it", async () => {
  let acknowledge!: () => void;
  let received!: () => void;
  const incoming = new Promise<void>((resolve) => {
    received = resolve;
  });
  failure = (_method, _key, response) => {
    acknowledge = () => response.end();
    received();
    return true;
  };
  let complete = false;
  const writing = storage.write(id, "image", new Uint8Array([1])).then(() => {
    complete = true;
  });
  await incoming;
  expect(complete).toBe(false);
  acknowledge();
  await writing;
  expect(complete).toBe(true);
});

it.each([
  "../private",
  "a".repeat(36),
  "--------------------0000000000000000",
  `${id}/image`,
])("rejects invalid object ID %s before sending requests", async (invalid) => {
  await expect(
    storage.write(invalid, "image", new Uint8Array()),
  ).rejects.toThrow();
  await expect(storage.read(invalid, "thumbnail")).rejects.toThrow();
  await expect(storage.remove(invalid)).rejects.toThrow();
  expect(requests).toEqual([]);
});

it("maps a confirmed missing key to Media not found", async () => {
  await expect(storage.read(id, "image")).rejects.toMatchObject({
    code: "MEDIA_NOT_FOUND",
  });
});

it.each(["AccessDenied", "NoSuchBucket"])(
  "propagates %s instead of claiming an object is missing",
  async (code) => {
    failure = (_method, _key, response) => {
      s3Error(response, code, code === "NoSuchBucket" ? 404 : 403);
      return true;
    };
    await expect(storage.read(id, "image")).rejects.toMatchObject({
      name: code,
    });
    await expect(storage.remove(id)).rejects.toMatchObject({ name: code });
  },
);

it("removes only both managed variants and supports repeated removal", async () => {
  await storage.write(id, "image", new Uint8Array([1]));
  await storage.write(id, "thumbnail", new Uint8Array([2]));
  objects.set("/vq-media-example/unrelated", Buffer.from("retain"));
  await storage.remove(id);
  await storage.remove(id);
  expect([...objects.keys()]).toEqual(["/vq-media-example/unrelated"]);
  expect(
    requests
      .filter(({ method }) => method === "DELETE")
      .map(({ path }) => path),
  ).toEqual([
    `/vq-media-example/media/${id}/image.webp`,
    `/vq-media-example/media/${id}/thumbnail.webp`,
    `/vq-media-example/media/${id}/image.webp`,
    `/vq-media-example/media/${id}/thumbnail.webp`,
  ]);
});

it("propagates a partial write failure without independently deleting bytes", async () => {
  failure = (method, key, response) => {
    if (method !== "PUT" || !key.endsWith("thumbnail.webp")) return false;
    s3Error(response, "AccessDenied");
    return true;
  };
  await storage.write(id, "image", new Uint8Array([1]));
  await expect(
    storage.write(id, "thumbnail", new Uint8Array([2])),
  ).rejects.toMatchObject({ name: "AccessDenied" });
  expect(objects.size).toBe(1);
  expect(await storage.read(id, "image")).toEqual(new Uint8Array([1]));
});

it("surfaces partial deletion failure so a later canonical retry can finish", async () => {
  await storage.write(id, "image", new Uint8Array([1]));
  await storage.write(id, "thumbnail", new Uint8Array([2]));
  failure = (method, key, response) => {
    if (method !== "DELETE" || !key.endsWith("thumbnail.webp")) return false;
    s3Error(response, "AccessDenied");
    return true;
  };
  await expect(storage.remove(id)).rejects.toMatchObject({
    name: "AccessDenied",
  });
  expect([...objects.keys()]).toEqual([
    `/vq-media-example/media/${id}/thumbnail.webp`,
  ]);
  failure = undefined;
  await storage.remove(id);
  expect(objects.size).toBe(0);
});
it("uses one canonical key for uppercase and lowercase UUID representations", async () => {
  await storage.write(id.toUpperCase(), "image", new Uint8Array([7]));
  expect(await storage.read(id, "image")).toEqual(new Uint8Array([7]));
  await storage.remove(id.toUpperCase());
  expect(objects.size).toBe(0);
});

it("accepts a confirmed missing key during removal but still removes the other variant", async () => {
  await storage.write(id, "thumbnail", new Uint8Array([8]));
  failure = (method, key, response) => {
    if (method !== "DELETE" || !key.endsWith("image.webp")) return false;
    s3Error(response, "NoSuchKey", 404);
    return true;
  };
  await storage.remove(id);
  expect(objects.size).toBe(0);
});

it("propagates an interrupted object stream instead of returning partial bytes", async () => {
  failure = (_method, _key, response) => {
    response.writeHead(200, { "content-length": "100" });
    response.write(Buffer.from([1, 2]));
    setImmediate(() => response.destroy());
    return true;
  };
  await expect(storage.read(id, "image")).rejects.toThrow();
});
