"use client";
import { useEffect, useState } from "react";
import { readPlaces, readGeoPlaces } from "@vq/api-client";
import type { Place, PlacesQuery } from "@vq/contracts";

type ReadState = { status: "loading" | "ready" | "error"; places: Place[] };
export function usePlaces(query: PlacesQuery, nearby = false) {
  const [state, setState] = useState<ReadState>({
    status: "loading",
    places: [],
  });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(query);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", places: [] });
    const parsed = JSON.parse(key) as PlacesQuery;
    const request = nearby
      ? readGeoPlaces(
          `${window.location.origin}/api`,
          {
            ...(parsed.q ? { q: parsed.q } : {}),
            ...(parsed.category ? { category: parsed.category } : {}),
            limit: parsed.limit,
          },
          controller.signal,
        )
      : readPlaces(`${window.location.origin}/api`, parsed, controller.signal);
    request
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ status: "ready", places: result.places });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ status: "error", places: [] });
      });
    return () => controller.abort();
  }, [key, attempt, nearby]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
