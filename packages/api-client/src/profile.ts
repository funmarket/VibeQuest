import {
  profileInputSchema,
  profileResponseSchema,
  type ProfileInput,
  handleAvailabilityQuerySchema,
  handleAvailabilityResponseSchema,
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

export async function profileHandleAvailable(
  baseURL: string,
  handle: string,
  signal?: AbortSignal,
) {
  const query = handleAvailabilityQuerySchema.parse({ handle });
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/profile/handle?${new URLSearchParams(query)}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("HANDLE_CHECK_UNAVAILABLE");
  return handleAvailabilityResponseSchema.parse(await response.json())
    .available;
}
