import { geoReadingSchema, type GeoReading } from "@vq/contracts";
export const fixMaximumAge = 5 * 60_000;
export const maximumUncertainty = 100;
export const presenceLifetime = 15 * 60_000;
export class GeoError extends Error {
  constructor(
    public readonly code:
      "INVALID_GEO_READING" | "GEO_CONFLICT" | "GEO_CONSENT_REQUIRED",
  ) {
    super(code);
  }
}
export function validateReading(input: unknown, now: number): GeoReading {
  const parsed = geoReadingSchema.safeParse(input);
  if (!parsed.success) throw new GeoError("INVALID_GEO_READING");
  const at = Date.parse(parsed.data.observedAt);
  if (
    at > now ||
    now - at > fixMaximumAge ||
    parsed.data.accuracy > maximumUncertainty
  )
    throw new GeoError("INVALID_GEO_READING");
  return parsed.data;
}
