"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Zap, Clock, Users, Plus, HeartHandshake } from "lucide-react";
import {
  Section,
  Empty,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

const cameraFeatures = [
  { id: "shot", icon: Camera },
  { id: "check", icon: Zap },
  { id: "flash", icon: Clock },
] as const;
const categories = [
  {
    id: "matching",
    emoji: "✨",
    feature: "circles",
    items: ["interest", "coffee", "flow"],
  },
  {
    id: "gatherings",
    emoji: "🌍",
    feature: "guardian",
    items: ["meetups", "walks", "outdoor"],
  },
  {
    id: "journeys",
    emoji: "🚶",
    feature: "trails",
    items: ["coffeeWalks", "localTrails", "sunset"],
  },
  {
    id: "sanctuaries",
    emoji: "🏖️",
    feature: "check",
    items: ["nooks", "roofs", "gardens"],
  },
] as const;

export function SharePage() {
  const t = useTranslations("share");
  const c = useTranslations("common");
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <div className="share-content">
      <section className="share-hero" aria-labelledby="share-title">
        <h1 id="share-title">
          <span>{t("headlineLead")}</span> <span>{t("headlineEnd")}</span>
        </h1>
        <p>{t("intro")}</p>
        <div className="share-camera-tiles">
          {cameraFeatures.map(({ id, icon: Glyph }) => (
            <button
              key={id}
              className="share-camera-tile"
              data-feature={id}
              aria-describedby="share-availability"
              onClick={() => setNotice(t(id))}
            >
              <span className="share-camera-badge">
                <Glyph data-icon-role="metadata" aria-hidden />
              </span>
              <span>
                <strong>{t(id)}</strong>
                <small>{t(`${id}Hint`)}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <button
        className="broadcast-button"
        aria-describedby="share-availability"
        onClick={() => setNotice(t("capture"))}
      >
        <Camera data-icon-role="action" aria-hidden />
        {t("broadcast")}
      </button>
      <span id="share-availability" className="pending-label">
        {c("notAvailable")}
      </span>
      <div className="share-grid">
        <div className="share-filters">
          {(
            [
              ["pure", "💖"],
              ["friendly", "🤗"],
              ["moments", "🧘"],
              ["nearby", "📍"],
              ["communities", "👥"],
              ["createCommunity", "➕"],
            ] as const
          ).map(([id, emoji]) => (
            <button
              className="soft-button"
              key={id}
              onClick={() => setNotice(t(id))}
            >
              <span aria-hidden>{emoji}</span>
              {t(id)}
            </button>
          ))}
        </div>
        <Section title={t("feed")} className="share-feed-panel">
          <Empty>{t("feedEmpty")}</Empty>
        </Section>
        <Section title={t("compass")}>
          <p>{t("compassBody")}</p>
          <span className="pending-label">{c("notAvailable")}</span>
        </Section>
        <div className="share-categories">
          {categories.map(({ id, emoji, feature, items }) => (
            <section key={id} className="share-category" data-feature={feature}>
              <h2>
                <span aria-hidden>{emoji}</span>
                {t(id)}
              </h2>
              <ul>
                {items.map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Section title={t("circles")} className="circles-panel">
          <Users
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("circlesBody")}</p>
          <button
            className="soft-button"
            onClick={() => setNotice(t("createCommunity"))}
          >
            <Plus data-icon-role="action" aria-hidden />
            {t("createCommunity")}
          </button>
        </Section>
        <Section title={t("support")} className="support-panel">
          <HeartHandshake
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("supportBody")}</p>
        </Section>
      </div>
      <PageEnd />
      {notice && (
        <NoticeDialog title={notice} onClose={() => setNotice(null)}>
          <p>{c("notAvailable")}</p>
        </NoticeDialog>
      )}
    </div>
  );
}
