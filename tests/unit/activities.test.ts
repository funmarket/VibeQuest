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

it("carries only a bounded location query into localized Explore navigation", async () => {
  const { activityExploreHref, exploreSearch } =
    await import("../../apps/web/src/features/explore/navigation");
  expect(activityExploreHref("ar", { location: "  المدينة & café?  " })).toBe(
    "/ar/explore?q=%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9+%26+caf%C3%A9%3F",
  );
  expect(exploreSearch(["one", "two"])).toBe("");
  expect(exploreSearch("   ")).toBe("");
  expect(exploreSearch("a".repeat(200))).toHaveLength(120);
});
