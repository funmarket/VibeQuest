import {
  profileInputSchema,
  profileResponseSchema,
  type ProfileInput,
} from "@vq/contracts";
export async function profileRequest(baseURL: string, input?: ProfileInput) {
  const response = await fetch(`${baseURL.replace(/\/$/, "")}/v1/profile/me`, {
    method: input ? "PUT" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: input ? { "Content-Type": "application/json" } : {},
    body: input ? JSON.stringify(profileInputSchema.parse(input)) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      ["STALE_PROFILE", "HANDLE_UNAVAILABLE", "AUTH_REQUIRED"].includes(
        payload?.code,
      )
        ? payload.code
        : "PROFILE_UNAVAILABLE",
    );
  }
  return profileResponseSchema.parse(await response.json());
}
