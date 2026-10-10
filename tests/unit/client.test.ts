import { expect, it } from "vitest";
import { readPlaces } from "@vq/api-client";

it("preserves the frontend API prefix on a successful HTTP read", async () => {
  const { createServer } = await import("node:http");
  let requestPath = "";
  const server = createServer((request, response) => {
    requestPath = request.url ?? "";
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ places: [] }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No server address");
  try {
    expect(
      await readPlaces(`http://127.0.0.1:${address.port}/api`, {
        west: 10,
        east: 11,
        south: 35,
        north: 37,
        limit: 50,
      }),
    ).toEqual({ places: [] });
    expect(requestPath.startsWith("/api/v1/places?")).toBe(true);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

it("rejects HTTP failure instead of returning an empty successful collection", async () => {
  const server = await import("node:http");
  const app = server.createServer((_req, res) => {
    res.writeHead(503);
    res.end('{"error":{"code":"PLACES_UNAVAILABLE"}}');
  });
  await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
  const address = app.address();
  if (!address || typeof address === "string")
    throw new Error("missing server address");
  try {
    await expect(
      readPlaces(`http://127.0.0.1:${address.port}`, {
        west: 10,
        east: 11,
        south: 35,
        north: 37,
        limit: 50,
      }),
    ).rejects.toThrow("503");
  } finally {
    app.close();
  }
});
