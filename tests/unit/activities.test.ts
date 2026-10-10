import { it, expect } from "vitest";
import { validateSchedule } from "../../packages/activities/src/domain/invariants";
import { activityInputSchema, type Activity } from "@vq/contracts";
const input = activityInputSchema.parse({
  title: "Real gathering",
  description: "",
  location: "Medina",
  emoji: "🍵",
  startsAt: null,
  mediaIds: [],
});
it("does not invent an expiry for a live activity and rejects past new schedules", () => {
  expect(() => validateSchedule(input, undefined, 1000)).not.toThrow();
  expect(() =>
    validateSchedule(
      { ...input, startsAt: new Date(900).toISOString() },
      undefined,
      1000,
    ),
  ).toThrow("INVALID_SCHEDULE");
});
it("does not resurrect cancellations or move started activities back to Upcoming", () => {
  const current = { ...input, status: "live" } as Activity;
  expect(() =>
    validateSchedule(
      { ...input, startsAt: new Date(2000).toISOString() },
      current,
      1000,
    ),
  ).toThrow("INVALID_SCHEDULE");
  expect(() =>
    validateSchedule(input, { ...current, status: "cancelled" }, 1000),
  ).toThrow("ACTIVITY_CONFLICT");
});
