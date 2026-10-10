"use client";
import { useEffect, useState } from "react";
import { readPlaces } from "@vq/api-client";
import type { Place, PlacesQuery } from "@vq/contracts";

type ReadState = { status: "loading" | "ready" | "error"; places: Place[] };
export function usePlaces(query: PlacesQuery) {
  const [state, setState] = useState<ReadState>({
    status: "loading",
    places: [],
  });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(query);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", places: [] });
    readPlaces(
      `${window.location.origin}/api`,
      JSON.parse(key) as PlacesQuery,
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ status: "ready", places: result.places });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ status: "error", places: [] });
      });
    return () => controller.abort();
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
