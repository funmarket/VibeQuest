import type { Activity, ActivityInput } from "@vq/contracts";
export class ActivityError extends Error {
  constructor(
    public readonly code:
      | "PROFILE_INCOMPLETE"
      | "INVALID_ACTIVITY_MEDIA"
      | "INVALID_SCHEDULE"
      | "ACTIVITY_FORBIDDEN"
      | "ACTIVITY_NOT_FOUND"
      | "ACTIVITY_CONFLICT"
      | "REVIEWS_NOT_SUPPORTED",
  ) {
    super(code);
  }
}
export function validateSchedule(
  input: ActivityInput,
  current?: Activity,
  now = Date.now(),
) {
  if (current) {
    if (current.status === "cancelled")
      throw new ActivityError("ACTIVITY_CONFLICT");
    if (current.status === "live" && input.startsAt !== current.startsAt)
      throw new ActivityError("INVALID_SCHEDULE");
  }
  if (
    input.startsAt &&
    (!current || input.startsAt !== current.startsAt) &&
    Date.parse(input.startsAt) <= now
  )
    throw new ActivityError("INVALID_SCHEDULE");
}
