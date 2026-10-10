"use client";
import { useState } from "react";
import { ActivitiesPanel } from "../activities/activities-panel";
import { EventsPanel } from "../events/events-panel";
import { tabKeyboard } from "../../components/tab-keyboard";
import { useTranslations } from "next-intl";
import {
  Radio,
  Zap,
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

export function HomePage() {
  const t = useTranslations("home");
  const c = useTranslations("common");
  const [notice, setNotice] = useState<string | null>(null);
  const [feed, setFeed] = useState("network");
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{c("brandTagline")}</span>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div className="home-grid">
        <Section title={t("checkins")} className="checkins-panel">
          <span className="status-label">
            <Radio size={15} aria-hidden />
            {t("current")}
          </span>
          <div className="empty-orbits" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
          <Empty>{t("checkinsEmpty")}</Empty>
        </Section>
        <Section title={t("flash")} className="flash-panel">
          <Zap className="feature-symbol" aria-hidden />
          <Empty>{t("flashEmpty")}</Empty>
          <div className="button-row">
            <PendingButton onClick={() => setNotice(t("hunt"))}>
              {t("hunt")}
            </PendingButton>
            <PendingButton onClick={() => setNotice(t("create"))}>
              {t("create")}
            </PendingButton>
          </div>
        </Section>
        <ActivitiesPanel />
        <EventsPanel />
        <Section title={t("streak")} className="streak-panel">
          <Flame className="feature-symbol" aria-hidden />
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
            <Radar size={38} />
          </div>
          <p>{t("radarBody")}</p>
          <PendingButton onClick={() => setNotice(t("radar"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("hub")}>
          <Users className="feature-symbol" aria-hidden />
          <p>{t("hubBody")}</p>
          <PendingButton onClick={() => setNotice(t("hub"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <section className="panel feed-panel">
          <div
            className="tab-rail"
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
            <Empty>{t("feedEmpty")}</Empty>
          </div>
        </section>
        <Section title={t("coordinates")}>
          <MapPinned className="feature-symbol" aria-hidden />
          <Empty>{c("notAvailable")}</Empty>
        </Section>
        <Section title={t("gems")}>
          <Footprints className="feature-symbol" aria-hidden />
          <Empty>{c("empty")}</Empty>
        </Section>
        <Section title={t("guide")} className="guide-panel">
          <BookOpen className="feature-symbol" aria-hidden />
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
