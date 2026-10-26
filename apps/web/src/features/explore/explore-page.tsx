"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin,
  Search,
  List,
  Map,
  VenetianMask,
  Route,
  ShieldCheck,
  Compass,
  Radar,
  Plus,
  Flag,
  MessageCircle,
} from "lucide-react";
import { useArea } from "./area-provider";
import { useGeo } from "../geo/geo-provider";
import { LocationSummary } from "../geo/location-display";
import { boundsSchema } from "@vq/contracts";
import { usePlaces } from "./use-places";
import { PlacesMap } from "./places-map";
import {
  Section,
  Empty,
  PendingButton,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

const categories = [
  "all",
  "food",
  "cafes",
  "culture",
  "art",
  "venues",
  "hidden",
] as const;
const categoryMapping: Record<string, string> = {
  food: "food",
  cafes: "cafe",
  culture: "culture",
  art: "art",
  venues: "venue",
  hidden: "hidden",
};

export function ExplorePage({
  initialSearch = "",
  initialCategory = "all",
}: {
  initialSearch?: string;
  initialCategory?: "all" | "art" | "venues";
}) {
  const t = useTranslations("explore");
  const c = useTranslations("common");
  const area = useArea(),
    geo = useGeo();
  const presence = geo.state?.presence;
  const bounds =
    area.manual || !presence
      ? area.bounds
      : {
          west: Math.max(-180, presence.longitude - 0.05),
          east: Math.min(180, presence.longitude + 0.05),
          south: Math.max(-90, presence.latitude - 0.05),
          north: Math.min(90, presence.latitude + 0.05),
          limit: 50,
        };
  const [draft, setDraft] = useState(area.bounds);
  const [category, setCategory] = useState<string>(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [q, setQ] = useState(initialSearch);
  const [view, setView] = useState<"list" | "map">("list");
  const [notice, setNotice] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const data = usePlaces(
    {
      ...bounds,
      ...(q ? { q } : {}),
      ...(category === "all" ? {} : { category: categoryMapping[category] }),
    },
    !area.manual && Boolean(presence),
  );
  return (
    <>
      <LocationSummary />
      <div className="page-heading">
        <div className="eyebrow">
          <Compass data-icon-role="metadata" aria-hidden />
          {t("community")}
          <span className="dot-separator" />
          {t("business")}
        </div>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div className="explore-top">
        <button
          className="soft-button"
          onClick={() => {
            setDraft(area.bounds);
            setNotice("area");
          }}
        >
          <MapPin data-icon-role="metadata" aria-hidden />
          {t("chooseBounds")}
        </button>
        <PendingButton onClick={() => setNotice("spawn")}>
          {t("spawn")}
        </PendingButton>
      </div>
      <div className="explore-prelude">
        <Section title={t("secrets")} className="flash-panel">
          <VenetianMask
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <Empty>{t("pendingBody")}</Empty>
        </Section>
        <Section title={t("trails")} className="trails-panel">
          <Route
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <h3>{t("curation")}</h3>
          <Empty>{t("pendingBody")}</Empty>
        </Section>
      </div>
      <section className="panel discovery-panel">
        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            setQ(search.trim());
          }}
        >
          <Search data-icon-role="action" aria-hidden />
          <input
            aria-label={t("search")}
            placeholder={t("search")}
            value={search}
            maxLength={120}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="primary-button"
            type="submit"
            aria-label={t("search")}
          >
            <Search data-icon-role="action" aria-hidden />
          </button>
        </form>
        <div className="category-rail" aria-label={t("filter")}>
          {categories.map((id) => (
            <button
              key={id}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {t(id)}
            </button>
          ))}
        </div>
        <div className="results-heading">
          <p>{t("results", { count: data.places.length })}</p>
          <div className="view-toggle">
            <button
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List data-icon-role="action" aria-hidden />
              {t("list")}
            </button>
            <button
              aria-pressed={view === "map"}
              onClick={() => setView("map")}
            >
              <Map data-icon-role="action" aria-hidden />
              {t("map")}
            </button>
          </div>
        </div>
        <p className="area-caption">
          {t("chooseBounds")}:{" "}
          <bdi>
            {bounds.west.toFixed(2)}–{bounds.east.toFixed(2)} /{" "}
            {bounds.south.toFixed(2)}–{bounds.north.toFixed(2)}
          </bdi>
        </p>
        <div aria-live="polite" className="places-state">
          {data.status === "loading" && <Empty>{c("loading")}</Empty>}
          {data.status === "error" && (
            <div role="alert">
              <p>{t("error")}</p>
              <button className="primary-button" onClick={data.retry}>
                {c("retry")}
              </button>
            </div>
          )}
          {view === "map" && <PlacesMap places={data.places} bounds={bounds} />}
          {data.status === "ready" && data.places.length === 0 && (
            <Empty>{t("empty")}</Empty>
          )}
          {data.status === "ready" && data.places.length > 0 && (
            <ul className="place-list">
              {data.places.map((place) => (
                <li className="place-card" key={place.id}>
                  <span className="place-glyph">
                    <MapPin data-icon-role="action" aria-hidden />
                  </span>
                  <div>
                    <h3>
                      <bdi>{place.name}</bdi>
                    </h3>
                    <p>{place.category}</p>
                    <small>
                      <bdi>
                        {place.latitude.toFixed(4)},{" "}
                        {place.longitude.toFixed(4)}
                      </bdi>
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="contribution-actions">
          <button onClick={() => setNotice("suggest")}>
            <Plus data-icon-role="action" aria-hidden />
            {t("suggest")}
          </button>
          <button onClick={() => setNotice("report")}>
            <Flag data-icon-role="action" aria-hidden />
            {t("report")}
          </button>
          <button onClick={() => setNotice("ask")}>
            <MessageCircle data-icon-role="action" aria-hidden />
            {t("ask")}
          </button>
        </div>
      </section>
      <div className="explore-bottom">
        <Section title={t("radar")} className="radar-panel">
          <div className="radar-art" aria-hidden>
            <span />
            <span />
            <Radar data-icon-role="illustration" aria-hidden />
          </div>
          <h3>{t("heat")}</h3>
          <p>{t("radarBody")}</p>
        </Section>
        <Section title={t("guardian")} className="guardian-panel">
          <ShieldCheck
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("guardianBody")}</p>
        </Section>
        <Section title={t("suggestions")}>
          <Empty>{t("pendingBody")}</Empty>
        </Section>
      </div>
      <PageEnd />
      {notice && (
        <NoticeDialog
          title={
            notice === "area"
              ? t("chooseBounds")
              : notice === "spawn"
                ? t("spawn")
                : t(notice)
          }
          onClose={() => {
            setNotice(null);
            setInvalid(false);
          }}
        >
          {notice === "area" ? (
            <>
              <p>{t("area")}</p>
              <form
                className="bounds-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const parsed = boundsSchema.safeParse(draft);
                  if (!parsed.success) {
                    setInvalid(true);
                    return;
                  }
                  area.select(parsed.data);
                  setNotice(null);
                  setInvalid(false);
                }}
              >
                {(["west", "east", "south", "north"] as const).map((key) => (
                  <label key={key}>
                    {t(key)}
                    <input
                      required
                      type="number"
                      step="any"
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          [key]: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                ))}
                {invalid && <p role="alert">{t("invalidBounds")}</p>}
                <button className="primary-button" type="submit">
                  {t("apply")}
                </button>
              </form>
              <button
                className="soft-button"
                onClick={() => {
                  area.followDevice();
                  void geo.refresh();
                }}
              >
                {c("useLocation")}
              </button>
            </>
          ) : (
            <>
              <p>
                {notice === "spawn" ? t("pendingBody") : t(`${notice}Body`)}
              </p>
              <p className="pending-label">{t("contributionBody")}</p>
            </>
          )}
        </NoticeDialog>
      )}
    </>
  );
}
