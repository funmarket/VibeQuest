import {
  boundsSchema,
  placesResponseSchema,
  type PlacesQuery,
  type PlacesResponse,
} from "@vq/contracts";
export { accountRequest, AccountRequestError } from "./identity";
export { profileRequest, profileHandleAvailable } from "./profile";
export {
  myBusinesses,
  createBusiness,
  inviteBusinessMember,
  acceptBusinessMembership,
} from "./business";
export { uploadImage, attachProfilePhoto, deleteMedia } from "./media";
export * from "./activities";
export * from "./events";
export * from "./social";

export async function readPlaces(
  baseURL: string,
  query: PlacesQuery,
  signal?: AbortSignal,
): Promise<PlacesResponse> {
  const parsed = boundsSchema.parse(query);
  const url = new URL("v1/places", `${baseURL.replace(/\/$/, "")}/`);
  for (const [key, value] of Object.entries(parsed))
    if (value !== undefined) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Places request failed (${response.status})`);
  return placesResponseSchema.parse(await response.json());
}
