import { describe, expect, it } from "vitest";
import { boundsSchema } from "@vq/contracts";
import { buildApi } from "../../apps/api/src/app";

describe("Public Places boundary", () => {
  it("rejects reversed, missing, unbounded and nonnumeric viewports", () => {
    for (const bounds of [
      {},
      { west: 11, east: 10, south: 35, north: 37 },
      { west: -181, east: 10, south: 35, north: 37 },
      { west: "bad", east: 10, south: 35, north: 37 },
      { west: -180, east: 180, south: -90, north: 90 },
    ]) {
      expect(boundsSchema.safeParse(bounds).success).toBe(false);
    }
  });
  it("accepts a bounded viewport and caps requested result count", () => {
    const parsed = boundsSchema.parse({
      west: 10,
      east: 11,
      south: 35,
      north: 37,
    });
    expect(parsed.limit).toBe(50);
    expect(boundsSchema.safeParse({ ...parsed, limit: 101 }).success).toBe(
      false,
    );
  });
  it("returns a service error instead of successful fabricated data on query failure", async () => {
    const app = buildApi({
      listPublished: async () => {
        throw new Error("database unavailable");
      },
    });
    const response = await app.inject(
      "/v1/places?west=10&east=11&south=35&north=37",
    );
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        code: "PLACES_UNAVAILABLE",
        message: "Places are temporarily unavailable.",
      },
    });
    await app.close();
  });
  it("returns an honest empty collection and rejects invalid API input before querying", async () => {
    let calls = 0;
    const app = buildApi({
      listPublished: async () => {
        calls += 1;
        return [];
      },
    });
    const invalid = await app.inject(
      "/v1/places?west=11&east=10&south=35&north=37",
    );
    expect(invalid.statusCode).toBe(400);
    expect(calls).toBe(0);
    const valid = await app.inject(
      "/v1/places?west=10&east=11&south=35&north=37",
    );
    expect(valid.json()).toEqual({ places: [] });
    expect(calls).toBe(1);
    await app.close();
  });
});
