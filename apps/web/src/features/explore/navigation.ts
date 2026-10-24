import type { Activity, PlacesQuery } from "@vq/contracts";

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
