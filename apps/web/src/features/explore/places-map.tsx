"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@vq/ui/theme";
import { MapPinned } from "lucide-react";
import type { Place, PlacesQuery } from "@vq/contracts";
import "maplibre-gl/dist/maplibre-gl.css";

export function PlacesMap({
  places,
  bounds,
}: {
  places: Place[];
  bounds: PlacesQuery;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const t = useTranslations("explore");
  const [failed, setFailed] = useState(false);
  const style =
    theme === "dark"
      ? process.env.NEXT_PUBLIC_MAP_STYLE_DARK
      : process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT;
  const validStyle = style?.startsWith("https://");
  const west = bounds.west,
    east = bounds.east,
    south = bounds.south,
    north = bounds.north;
  useEffect(() => {
    if (!container.current || !validStyle || !style) return;
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    setFailed(false);
    void import("maplibre-gl")
      .then(({ Map, Marker, NavigationControl }) => {
        if (disposed || !container.current) return;
        map = new Map({
          container: container.current,
          style,
          bounds: [
            [west, south],
            [east, north],
          ],
          fitBoundsOptions: { padding: 35 },
          attributionControl: {},
        });
        map.addControl(new NavigationControl(), "top-right");
        map.on("error", () => {
          if (!disposed) setFailed(true);
        });
        for (const place of places) {
          const marker = document.createElement("span");
          marker.className = "place-marker";
          marker.title = place.name;
          new Marker({ element: marker })
            .setLngLat([place.longitude, place.latitude])
            .addTo(map);
        }
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [style, validStyle, west, east, south, north, places]);
  if (!validStyle || failed)
    return (
      <div className="map-unavailable" role="status">
        <MapPinned size={44} aria-hidden />
        <h3>{t("mapUnavailable")}</h3>
        <p>{t("mapBody")}</p>
      </div>
    );
  return (
    <div
      ref={container}
      className="places-map"
      role="region"
      aria-label={t("map")}
    />
  );
}
