import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../packages/database/src/index";
import { migrate } from "../../packages/database/src/migration-runner";
import { buildApi } from "../../apps/api/src/app";

const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error("TEST_DATABASE_URL is required for integration tests.");
const parsedURL = new URL(url);
if (
  !["127.0.0.1", "localhost", "[::1]"].includes(parsedURL.hostname) ||
  parsedURL.pathname !== "/vq_test"
)
  throw new Error("Integration tests require loopback database vq_test.");
const database = createDatabase(url);
const app = buildApi(database.repository, { readiness: database.readiness });
const ids = Array.from({ length: 5 }, () => randomUUID());
const category = `test-${randomUUID()}`;
describe("PostGIS public Places flow", () => {
  beforeAll(async () => {
    await migrate(database.pool);
    await migrate(database.pool);
    const fixtures = [
      ["Lower edge", 10, 35, "published"],
      ["Upper edge", 11, 37, "published"],
      ["Outside", 11.1, 36, "published"],
      ["Private", 10.5, 36, "draft"],
      ["Literal ' OR 1=1 --", 10.5, 36, "published"],
    ] as const;
    for (const [index, fixture] of fixtures.entries())
      await database.pool.query(
        "INSERT INTO places(id,name,category,location,publication_status) VALUES($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326),$6)",
        [ids[index], fixture[0], category, fixture[1], fixture[2], fixture[3]],
      );
  });
  afterAll(async () => {
    try {
      await database.pool.query(
        "DELETE FROM places WHERE id = ANY($1::uuid[])",
        [ids],
      );
    } finally {
      await app.close();
      await database.close();
    }
  });
  it("reads persisted published points including exact viewport edges", async () => {
    const response = await app.inject(
      `/v1/places?west=10&east=11&south=35&north=37&category=${category}`,
    );
    expect(response.statusCode).toBe(200);
    expect(
      response
        .json()
        .places.map((place: { id: string }) => place.id)
        .sort(),
    ).toEqual([ids[0], ids[1], ids[4]].sort());
    expect(response.json().places[0]).toMatchObject({
      category,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
  it("caps results and rejects broad/unknown queries before SQL", async () => {
    const limited = await app.inject(
      `/v1/places?west=10&east=11&south=35&north=37&category=${category}&limit=1`,
    );
    expect(limited.json().places).toHaveLength(1);
    for (const suffix of ["limit=101", "foo=bar", "west=NaN"]) {
      const query = new URLSearchParams({
        west: "10",
        east: "11",
        south: "35",
        north: "37",
      });
      const [key, value] = suffix.split("=");
      query.set(key, value);
      expect((await app.inject(`/v1/places?${query}`)).statusCode).toBe(400);
    }
    expect(
      (await app.inject("/v1/places?west=0&east=6&south=0&north=1")).statusCode,
    ).toBe(400);
  });
  it("treats injection syntax and SQL wildcards as literal search text", async () => {
    const query = new URLSearchParams({
      west: "10",
      east: "11",
      south: "35",
      north: "37",
      category,
      q: "' OR 1=1 --",
    });
    expect(
      (await app.inject(`/v1/places?${query}`))
        .json()
        .places.map((place: { id: string }) => place.id),
    ).toEqual([ids[4]]);
    query.set("q", "%");
    expect((await app.inject(`/v1/places?${query}`)).json()).toEqual({
      places: [],
    });
  });
  it("reports real database failure without manufacturing success", async () => {
    const failed = createDatabase("postgresql://vq_local@127.0.0.1:1/vq_test");
    const failedApp = buildApi(failed.repository, {
      readiness: failed.readiness,
    });
    try {
      expect(
        (await failedApp.inject("/v1/places?west=10&east=11&south=35&north=37"))
          .statusCode,
      ).toBe(503);
      expect((await failedApp.inject("/health/ready")).statusCode).toBe(503);
    } finally {
      await failedApp.close();
      await failed.close();
    }
  });
  it("readiness checks the actual schema", async () => {
    expect((await app.inject("/health/ready")).statusCode).toBe(200);
  });
  it("does not report ready when newly wired domain tables are missing", async () => {
    const schema = `health_${randomUUID().replaceAll("-", "")}`;
    await database.pool.query(`CREATE SCHEMA "${schema}"`);
    await database.pool.query(
      `CREATE TABLE "${schema}".places (LIKE public.places INCLUDING ALL)`,
    );
    const isolatedURL = new URL(url!);
    isolatedURL.searchParams.set("options", `-c search_path=${schema}`);
    const isolated = createDatabase(isolatedURL.toString());
    try {
      await expect(isolated.readiness()).rejects.toThrow();
    } finally {
      await isolated.close();
      await database.pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    }
  });
});
