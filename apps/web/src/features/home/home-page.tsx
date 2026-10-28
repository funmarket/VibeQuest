"use client";
import { useState } from "react";
import { LocationSummary } from "../geo/location-display";
import { NetworkFeed } from "./network-feed";
import { ActivitiesPanel } from "../activities/activities-panel";
import { EventsPanel } from "../events/events-panel";
import { tabKeyboard } from "../../components/tab-keyboard";
import { useTranslations } from "next-intl";
import {
  VenetianMask,
  Clock,
  Plus,
  Radar,
  Footprints,
  Flame,
  BookOpen,
  MapPinned,
  Users,
} from "lucide-react";
import {
  Section,
  Empty,
  PendingButton,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

export function HomePage({ postId = null }: { postId?: string | null }) {
  const t = useTranslations("home");
  const c = useTranslations("common");
  const [notice, setNotice] = useState<string | null>(null);
  const [feed, setFeed] = useState("network");
  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <LocationSummary />
      <div className="home-grid">
        <section className="checkins-panel" aria-labelledby="checkins-title">
          <h2 id="checkins-title">{t("checkins")}</h2>
          <div className="checkin-row">
            <div className="checkin-current">
              <small>{t("current")}</small>
              <strong>{t("notSet")}</strong>
            </div>
            <div className="checkin-empty">
              <span aria-hidden>🎒</span>
              <div>
                <strong>{t("checkinsUnavailable")}</strong>
                <small>{t("checkinsHint")}</small>
              </div>
            </div>
          </div>
        </section>
        <section
          className="home-flash-panel"
          aria-labelledby="home-flash-title"
        >
          <h2 id="home-flash-title">
            <VenetianMask data-icon-role="metadata" aria-hidden />
            {t("flash")}
          </h2>
          <div className="home-flash-layout">
            <div>
              <p>{t("flashEmpty")}</p>
              <div className="flash-metadata">
                <span>{t("rewardUnavailable")}</span>
                <span aria-hidden>•</span>
                <Clock data-icon-role="metadata" aria-hidden />
                <span>{t("noTimer")}</span>
              </div>
            </div>
            <div className="hunt-actions">
              <button
                className="hunt-primary"
                onClick={() => setNotice(t("hunt"))}
              >
                <span className="action-label">{t("hunt")}</span>
                <span aria-hidden>🏃</span>
              </button>
              <button
                className="hunt-secondary"
                onClick={() => setNotice(t("create"))}
              >
                <Plus data-icon-role="metadata" aria-hidden />
                <span className="action-label">{t("create")}</span>
              </button>
            </div>
          </div>
        </section>
        <section className="panel feed-panel">
          <div
            className="home-feed-tabs"
            role="tablist"
            aria-label={t("local")}
            onKeyDown={tabKeyboard}
          >
            {["network", "local", "forYou"].map((id) => (
              <button
                key={id}
                role="tab"
                tabIndex={feed === id ? 0 : -1}
                aria-selected={feed === id}
                aria-controls="home-feed"
                id={`feed-${id}`}
                onClick={() => setFeed(id)}
              >
                {t(id)}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="home-feed" aria-labelledby={`feed-${feed}`}>
            {feed === "network" ? (
              <NetworkFeed postId={postId} />
            ) : (
              <Empty>{t("feedEmpty")}</Empty>
            )}
          </div>
        </section>
        <ActivitiesPanel />
        <EventsPanel />
        <Section title={t("streak")} className="streak-panel">
          <Flame
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("streakBody")}</p>
          <div className="streak-track" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <span className="pending-label">{c("notAvailable")}</span>
        </Section>
        <Section title={t("radar")} className="radar-panel">
          <div className="radar-art" aria-hidden>
            <span />
            <span />
            <Radar data-icon-role="illustration" aria-hidden />
          </div>
          <p>{t("radarBody")}</p>
          <PendingButton onClick={() => setNotice(t("radar"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("hub")}>
          <Users
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("hubBody")}</p>
          <PendingButton onClick={() => setNotice(t("hub"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("coordinates")}>
          <MapPinned
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <Empty>{c("notAvailable")}</Empty>
        </Section>
        <Section title={t("gems")}>
          <Footprints
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <Empty>{c("empty")}</Empty>
        </Section>
        <Section title={t("guide")} className="guide-panel">
          <BookOpen
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("guideBody")}</p>
          <PendingButton onClick={() => setNotice(t("guide"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
      </div>
      <PageEnd />
      {notice && (
        <NoticeDialog title={notice} onClose={() => setNotice(null)}>
          <p>{notice === t("guide") ? t("guideBody") : c("notAvailable")}</p>
        </NoticeDialog>
      )}
    </>
  );
}
