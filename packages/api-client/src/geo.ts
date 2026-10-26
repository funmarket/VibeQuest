import {
  geoStateSchema,
  type GeoConsent,
  type GeoObservation,
} from "@vq/contracts";
import {
  geoPlacesQuerySchema,
  placesResponseSchema,
  type PlacesQuery,
} from "@vq/contracts";
export async function readGeoPlaces(
  baseURL: string,
  query: Pick<PlacesQuery, "q" | "category" | "limit">,
  signal?: AbortSignal,
) {
  const parsed = geoPlacesQuerySchema.parse(query),
    params = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed))
    if (value !== undefined) params.set(key, String(value));
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/geo/me/places?${params}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw Error("GEO_PLACES_UNAVAILABLE");
  return placesResponseSchema.parse(await response.json());
}
export async function geoRequest(
  baseURL: string,
  action: "read" | "consent" | "observation" | "unavailable" = "read",
  input?: GeoConsent | GeoObservation | Record<string, never>,
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/geo/me${action === "read" ? "" : "/" + action}`,
    {
      method:
        action === "read" ? "GET" : action === "unavailable" ? "POST" : "PUT",
      credentials: "same-origin",
      cache: "no-store",
      headers: action === "read" ? {} : { "Content-Type": "application/json" },
      body: action === "read" ? undefined : JSON.stringify(input),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Error(
      [
        "AUTH_REQUIRED",
        "GEO_CONFLICT",
        "INVALID_GEO_READING",
        "GEO_CONSENT_REQUIRED",
      ].includes(body?.code)
        ? body.code
        : "GEO_UNAVAILABLE",
    );
  }
  return geoStateSchema.parse(await response.json());
}
