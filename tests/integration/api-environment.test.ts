import { expect, it } from "vitest";
import { parseApiEnvironment } from "../../apps/api/src/environment";
import { buildApi } from "../../apps/api/src/app";

it("rejects missing or invalid runtime database/port configuration", () => {
  for (const environment of [
    {},
    { DATABASE_URL: "https://example.org/database" },
    { DATABASE_URL: "invalid" },
    { DATABASE_URL: "postgresql://localhost/vq_test", PORT: "NaN" },
    { DATABASE_URL: "postgresql://localhost/vq_test", PORT: "0" },
    { DATABASE_URL: "postgresql://localhost/vq_test", PORT: "65536" },
  ])
    expect(() => parseApiEnvironment(environment)).toThrow();
  expect(
    parseApiEnvironment({ DATABASE_URL: "postgresql://localhost/vq_test" }),
  ).toEqual({ databaseURL: "postgresql://localhost/vq_test", port: 4100 });
});

it("never claims ready without a readiness dependency", async () => {
  const app = buildApi({ listPublished: async () => [] });
  try {
    expect((await app.inject("/health/live")).statusCode).toBe(200);
    expect((await app.inject("/health/ready")).statusCode).toBe(503);
  } finally {
    await app.close();
  }
});
