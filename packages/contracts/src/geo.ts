import { z } from "zod";
export const geoPlacesQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    limit: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
      z.number().int().min(1).max(100).default(50),
    ),
  })
  .strict();
export const geoConsentSchema = z
  .object({
    version: z.number().int().nonnegative(),
    locationConsent: z.boolean(),
    socialSharing: z.boolean(),
  })
  .strict()
  .refine((v) => v.locationConsent || !v.socialSharing);
export const geoReadingSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    accuracy: z.number().finite().nonnegative(),
    observedAt: z.string().datetime(),
  })
  .strict();
export const geoObservationSchema = geoReadingSchema
  .extend({ version: z.number().int().nonnegative() })
  .strict();
export const geoPresenceSchema = geoReadingSchema
  .extend({
    acceptedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();
export const geoStateSchema = z
  .object({
    version: z.number().int().nonnegative(),
    decided: z.boolean(),
    locationConsent: z.boolean(),
    socialSharing: z.boolean(),
    presence: geoPresenceSchema.nullable(),
  })
  .strict();
export type GeoReading = z.infer<typeof geoReadingSchema>;
export type GeoObservation = z.infer<typeof geoObservationSchema>;
export type GeoConsent = z.infer<typeof geoConsentSchema>;
export type GeoState = z.infer<typeof geoStateSchema>;
export type GeoPresence = z.infer<typeof geoPresenceSchema>;
