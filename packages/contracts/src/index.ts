import { z } from "zod";
export * from "./business";
export * from "./activities";
export * from "./events";
export * from "./social";
export {
  credentialsSchema,
  accountSchema,
  accountResponseSchema,
} from "./identity";
export type { Account, AccountResponse } from "./identity";
export {
  profileInputSchema,
  profileSchema,
  profileResponseSchema,
  profilePhotoInputSchema,
  profileInterestPresets,
  interestSchema,
  handleAvailabilityQuerySchema,
  handleAvailabilityResponseSchema,
} from "./profile";
export type { Profile, ProfileInput } from "./profile";
export { uploadInputSchema, mediaSchema, mediaResponseSchema } from "./media";
export type { MediaObject } from "./media";

const coordinate = (min: number, max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? Number(value) : value,
    z.number().finite().min(min).max(max),
  );
export const boundsSchema = z
  .object({
    west: coordinate(-180, 180),
    east: coordinate(-180, 180),
    south: coordinate(-90, 90),
    north: coordinate(-90, 90),
    limit: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() !== ""
          ? Number(value)
          : value,
      z.number().int().min(1).max(100).default(50),
    ),
    q: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(60).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.east > value.west &&
      value.north > value.south &&
      value.east - value.west <= 5 &&
      value.north - value.south <= 5,
    { message: "A viewport must be ordered and at most five degrees across." },
  );
export type PlacesQuery = z.infer<typeof boundsSchema>;
export const placeSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.string(),
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type Place = z.infer<typeof placeSchema>;
export const placesResponseSchema = z
  .object({ places: z.array(placeSchema) })
  .strict();
export type PlacesResponse = z.infer<typeof placesResponseSchema>;
export interface PlacesRepository {
  listPublished(query: PlacesQuery): Promise<Place[]>;
}
