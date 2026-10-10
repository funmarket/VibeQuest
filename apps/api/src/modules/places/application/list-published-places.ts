import {
  placesResponseSchema,
  type PlacesQuery,
  type PlacesRepository,
} from "@vq/contracts";

export class PlacesUnavailableError extends Error {
  readonly code = "PLACES_UNAVAILABLE";
  constructor(cause: unknown) {
    super("Places are temporarily unavailable.", { cause });
    this.name = "PlacesUnavailableError";
  }
}

export function createListPublishedPlaces(repository: PlacesRepository) {
  return async (query: PlacesQuery) => {
    try {
      return placesResponseSchema.parse({
        places: await repository.listPublished(query),
      });
    } catch (cause) {
      throw new PlacesUnavailableError(cause);
    }
  };
}
export type ListPublishedPlaces = ReturnType<typeof createListPublishedPlaces>;
