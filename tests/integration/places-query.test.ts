import { expect, it } from "vitest";
import {
  createListPublishedPlaces,
  PlacesUnavailableError,
} from "../../apps/api/src/modules/places/application/list-published-places";

const query = { west: 10, east: 11, south: 35, north: 37, limit: 50 };
it("Places application query owns public output validation and hides invalid persistence output", async () => {
  const list = createListPublishedPlaces({
    listPublished: async () => [{ id: "invalid-output" }] as never,
  });
  await expect(list(query)).rejects.toBeInstanceOf(PlacesUnavailableError);
});
it("Places application query preserves an honest empty result", async () => {
  await expect(
    createListPublishedPlaces({ listPublished: async () => [] })(query),
  ).resolves.toEqual({ places: [] });
});
