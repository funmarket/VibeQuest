import type { EventInput, OfficialEvent } from "@vq/contracts";
export class EventError extends Error {
  constructor(
    public readonly code:
      | "EVENT_FORBIDDEN"
      | "EVENT_NOT_FOUND"
      | "EVENT_CONFLICT"
      | "INVALID_EVENT_MEDIA"
      | "INVALID_EVENT_SCHEDULE"
      | "EVENT_PROFILE_REQUIRED",
  ) {
    super(code);
  }
}
export function validateEventSchedule(
  input: EventInput,
  current?: OfficialEvent,
  now = Date.now(),
) {
  if (current) {
    if (current.status === "cancelled") throw new EventError("EVENT_CONFLICT");
    if (current.status === "live" && current.startsAt !== input.startsAt)
      throw new EventError("INVALID_EVENT_SCHEDULE");
    if (current.businessId !== input.businessId)
      throw new EventError("EVENT_FORBIDDEN");
  }
  if (
    input.startsAt &&
    (!current || input.startsAt !== current.startsAt) &&
    Date.parse(input.startsAt) <= now
  )
    throw new EventError("INVALID_EVENT_SCHEDULE");
}
