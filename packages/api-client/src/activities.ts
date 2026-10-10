import {
  activityInputSchema,
  activityEditSchema,
  activityReviewInputSchema,
  activityResponseSchema,
  activitiesResponseSchema,
  activityReviewsResponseSchema,
  type ActivityInput,
  type ActivityEdit,
  type ActivityReviewInput,
} from "@vq/contracts";
export class ActivityRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
async function request(
  baseURL: string,
  path: string,
  method = "GET",
  input?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/v1/activities${path}`,
    {
      method,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(input === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ActivityRequestError(body?.code ?? "ACTIVITIES_UNAVAILABLE");
  }
  return response.json();
}
export async function readActivities(
  base: string,
  tab: "live" | "upcoming",
  offset = 0,
  signal?: AbortSignal,
) {
  return activitiesResponseSchema.parse(
    await request(
      base,
      `?tab=${tab}&offset=${offset}`,
      "GET",
      undefined,
      signal,
    ),
  );
}
export async function readActivity(base: string, id: string) {
  return activityResponseSchema.parse(await request(base, `/${id}`)).activity;
}
export async function postActivity(base: string, input: ActivityInput) {
  return activityResponseSchema.parse(
    await request(base, "", "POST", activityInputSchema.parse(input)),
  ).activity;
}
export async function editActivity(
  base: string,
  id: string,
  input: ActivityEdit,
) {
  return activityResponseSchema.parse(
    await request(base, `/${id}`, "PUT", activityEditSchema.parse(input)),
  ).activity;
}
export async function cancelActivity(
  base: string,
  id: string,
  version: number,
) {
  return activityResponseSchema.parse(
    await request(base, `/${id}/cancel`, "POST", { version }),
  ).activity;
}
export async function saveActivity(base: string, id: string, saved: boolean) {
  await request(base, `/${id}/save`, "PUT", { saved });
}
export async function reviewActivity(
  base: string,
  id: string,
  input: ActivityReviewInput,
) {
  await request(
    base,
    `/${id}/reviews`,
    "POST",
    activityReviewInputSchema.parse(input),
  );
}
export async function readActivityReviews(
  base: string,
  id: string,
  offset = 0,
  signal?: AbortSignal,
) {
  return activityReviewsResponseSchema.parse(
    await request(
      base,
      `/${id}/reviews?offset=${offset}`,
      "GET",
      undefined,
      signal,
    ),
  );
}
