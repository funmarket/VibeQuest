import {
  eventInputSchema,
  eventEditSchema,
  eventReviewInputSchema,
  eventResponseSchema,
  eventsResponseSchema,
  eventReviewsResponseSchema,
  type EventInput,
  type EventEdit,
  type EventReviewInput,
} from "@vq/contracts";
export class EventRequestError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
async function request(
  base: string,
  path: string,
  method = "GET",
  input?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(`${base.replace(/\/$/, "")}/v1/events${path}`, {
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
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new EventRequestError(body?.code ?? "EVENTS_UNAVAILABLE");
  }
  return response.json();
}
export async function readEvents(
  base: string,
  tab: "live" | "upcoming",
  offset = 0,
  signal?: AbortSignal,
) {
  return eventsResponseSchema.parse(
    await request(
      base,
      `?tab=${tab}&offset=${offset}`,
      "GET",
      undefined,
      signal,
    ),
  );
}
export async function readEvent(base: string, id: string) {
  return eventResponseSchema.parse(await request(base, `/${id}`)).event;
}
export async function postEvent(base: string, input: EventInput) {
  return eventResponseSchema.parse(
    await request(base, "", "POST", eventInputSchema.parse(input)),
  ).event;
}
export async function editEvent(base: string, id: string, input: EventEdit) {
  return eventResponseSchema.parse(
    await request(base, `/${id}`, "PUT", eventEditSchema.parse(input)),
  ).event;
}
export async function cancelEvent(base: string, id: string, version: number) {
  return eventResponseSchema.parse(
    await request(base, `/${id}/cancel`, "POST", { version }),
  ).event;
}
export async function rsvpEvent(base: string, id: string, going: boolean) {
  await request(base, `/${id}/rsvp`, "PUT", { going });
}
export async function reviewEvent(
  base: string,
  id: string,
  input: EventReviewInput,
) {
  await request(
    base,
    `/${id}/reviews`,
    "POST",
    eventReviewInputSchema.parse(input),
  );
}
export async function saveEvent(base: string, id: string, saved: boolean) {
  await request(base, `/${id}/save`, "PUT", { saved });
}
export async function readEventReviews(
  base: string,
  id: string,
  offset = 0,
  signal?: AbortSignal,
) {
  return eventReviewsResponseSchema.parse(
    await request(
      base,
      `/${id}/reviews?offset=${offset}`,
      "GET",
      undefined,
      signal,
    ),
  );
}
