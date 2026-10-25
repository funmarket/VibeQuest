import {
  publicProfileResponseSchema,
  socialListSchema,
  socialStateSchema,
  relationshipSchema,
  followInputSchema,
  blockInputSchema,
  blockedPeopleSchema,
  type SocialCursor,
} from "@vq/contracts";
export class SocialRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
async function request(
  base: string,
  path: string,
  input?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(`${base.replace(/\/$/, "")}/v1/${path}`, {
    method: input === undefined ? "GET" : "PUT",
    credentials: "same-origin",
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
      ...(input === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new SocialRequestError(body?.code ?? "SOCIAL_UNAVAILABLE");
  }
  return response.json();
}
export async function readPublicProfile(
  base: string,
  value: string,
  byId = false,
  signal?: AbortSignal,
) {
  return publicProfileResponseSchema.parse(
    await request(
      base,
      `public-profiles/${byId ? "id" : "handle"}/${encodeURIComponent(value)}`,
      undefined,
      signal,
    ),
  ).profile;
}
export async function readRelationships(
  base: string,
  side: "following" | "followers",
  cursor: SocialCursor | null = null,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ side });
  if (cursor) {
    params.set("afterTime", cursor.at);
    params.set("afterId", cursor.id);
  }
  return socialListSchema.parse(
    await request(base, `social/me?${params}`, undefined, signal),
  );
}
export async function readSocialState(
  base: string,
  id: string,
  signal?: AbortSignal,
) {
  return socialStateSchema.parse(
    await request(
      base,
      `social/users/${encodeURIComponent(id)}`,
      undefined,
      signal,
    ),
  );
}
export async function setFollowing(
  base: string,
  id: string,
  following: boolean,
) {
  return relationshipSchema.parse(
    await request(
      base,
      `social/users/${encodeURIComponent(id)}/follow`,
      followInputSchema.parse({ following }),
    ),
  );
}
export async function setBlocked(base: string, id: string, blocked: boolean) {
  return blockInputSchema.parse(
    await request(
      base,
      `social/users/${encodeURIComponent(id)}/block`,
      blockInputSchema.parse({ blocked }),
    ),
  );
}
export async function readBlockedPeople(base: string) {
  return blockedPeopleSchema.parse(await request(base, "social/me/blocked"))
    .people;
}
