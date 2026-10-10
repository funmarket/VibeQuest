import {
  businessInputSchema,
  businessInviteSchema,
  businessesResponseSchema,
  businessResponseSchema,
  type BusinessInput,
} from "@vq/contracts";
async function request(baseURL: string, path: string, input?: unknown) {
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/businesses${path}`,
    {
      method: input === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(input === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    },
  );
  if (!response.ok) throw new Error("Business request failed");
  return response.json();
}
export async function myBusinesses(baseURL: string) {
  return businessesResponseSchema.parse(await request(baseURL, "/me"))
    .businesses;
}
export async function createBusiness(baseURL: string, input: BusinessInput) {
  return businessResponseSchema.parse(
    await request(baseURL, "", businessInputSchema.parse(input)),
  ).business;
}
export async function inviteBusinessMember(
  baseURL: string,
  id: string,
  userId: string,
) {
  await request(
    baseURL,
    `/${id}/members`,
    businessInviteSchema.parse({ userId }),
  );
}
export async function acceptBusinessMembership(baseURL: string, id: string) {
  return businessResponseSchema.parse(
    await request(baseURL, `/${id}/membership/accept`, {}),
  ).business;
}
