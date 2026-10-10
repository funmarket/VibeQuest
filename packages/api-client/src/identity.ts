import {
  accountResponseSchema,
  credentialsSchema,
  type AccountResponse,
} from "@vq/contracts";
export class AccountRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export async function accountRequest(
  baseURL: string,
  action: "me" | "register" | "login" | "logout",
  input?: { email: string; password: string },
): Promise<AccountResponse> {
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/identity/${action}`,
    {
      method: action === "me" ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(input ? { "Content-Type": "application/json" } : {}),
      },
      body: input ? JSON.stringify(credentialsSchema.parse(input)) : undefined,
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new AccountRequestError(
      typeof payload?.code === "string" ? payload.code : "IDENTITY_UNAVAILABLE",
    );
  }
  return action === "logout"
    ? { account: null }
    : accountResponseSchema.parse(await response.json());
}
