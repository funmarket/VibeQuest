import { it, expect } from "vitest";
import { validateEventSchedule } from "../../packages/events/src/domain/invariants";
import { eventInputSchema, type OfficialEvent } from "@vq/contracts";
const input = eventInputSchema.parse({
  businessId: "11111111-1111-4111-8111-111111111111",
  title: "Official event",
  description: "",
  location: "Tunis",
  tag: "music",
  startsAt: null,
  mediaIds: [],
});
it("rejects past schedules without inventing a live-event duration", () => {
  expect(() => validateEventSchedule(input, undefined, 1000)).not.toThrow();
  expect(() =>
    validateEventSchedule(
      { ...input, startsAt: new Date(900).toISOString() },
      undefined,
      1000,
    ),
  ).toThrow("INVALID_EVENT_SCHEDULE");
});
it("cannot switch an existing event's business or resurrect a cancellation", () => {
  const current = { ...input, status: "live" } as OfficialEvent;
  expect(() =>
    validateEventSchedule(
      { ...input, businessId: "22222222-2222-4222-8222-222222222222" },
      current,
      1000,
    ),
  ).toThrow("EVENT_FORBIDDEN");
  expect(() =>
    validateEventSchedule(input, { ...current, status: "cancelled" }, 1000),
  ).toThrow("EVENT_CONFLICT");
});

it("hands Event names and exact categories to localized Explore without changing Activity navigation", async () => {
  const { eventExploreHref, exploreEventCategory, activityExploreHref } =
    await import("../../apps/web/src/features/explore/navigation");
  expect(eventExploreHref("fr", { title: "Art & café?", tag: "cafe" })).toBe(
    "/fr/explore?q=Art+%26+caf%C3%A9%3F&category=cafe",
  );
  expect(exploreEventCategory("music")).toBe("venues");
  expect(exploreEventCategory("art")).toBe("art");
  expect(exploreEventCategory("cafe")).toBe("all");
  expect(exploreEventCategory("theatre")).toBe("all");
  expect(exploreEventCategory(["art", "cafe"])).toBe("all");
  expect(exploreEventCategory("unknown")).toBe("all");
  expect(activityExploreHref("ar", { location: "Medina" })).toBe(
    "/ar/explore?q=Medina",
  );
});
