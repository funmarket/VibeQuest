import type { Activity, OfficialEvent, PlacesQuery } from "@vq/contracts";

// Navigation carries search text only; Places retains query and discovery ownership.
export function exploreSearch(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}
export function activityExploreHref(
  locale: string,
  activity: Pick<Activity, "location">,
): string {
  const query: Pick<PlacesQuery, "q"> = { q: exploreSearch(activity.location) };
  return "/" + locale + "/explore?" + new URLSearchParams({ q: query.q ?? "" });
}

// Original Explore uses Art/Venues for recognized Event tags and All otherwise.
export function exploreEventCategory(
  value: string | string[] | undefined,
): "art" | "venues" | "all" {
  return value === "music" ? "venues" : value === "art" ? "art" : "all";
}
export function eventExploreHref(
  locale: string,
  event: Pick<OfficialEvent, "title" | "tag">,
): string {
  return (
    "/" +
    locale +
    "/explore?" +
    new URLSearchParams({ q: exploreSearch(event.title), category: event.tag })
  );
}
