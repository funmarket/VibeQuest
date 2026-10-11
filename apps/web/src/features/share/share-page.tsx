"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Heart, Zap, Compass, Users, Sparkles } from "lucide-react";
import {
  Section,
  Empty,
  PendingButton,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

export function SharePage() {
  const t = useTranslations("share");
  const c = useTranslations("common");
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <>
      <div className="share-hero">
        <span className="hero-heart" aria-hidden>
          <Heart data-icon-role="feature" data-icon-fill="solid" aria-hidden />
        </span>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div className="share-grid">
        <Section title={t("shot")} className="capture-panel">
          <div className="capture-frame">
            <Camera
              data-icon-role="illustration"
              data-icon-tone="identity"
              aria-hidden
            />
            <p>{t("shotBody")}</p>
            <span className="pending-label">{c("notAvailable")}</span>
          </div>
          <PendingButton onClick={() => setNotice(t("shot"))}>
            {t("capture")}
          </PendingButton>
        </Section>
        <Section title={t("check")}>
          <Sparkles
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("checkBody")}</p>
          <PendingButton onClick={() => setNotice(t("check"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("flash")}>
          <Zap
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("flashBody")}</p>
          <PendingButton onClick={() => setNotice(t("flash"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <section className="mood-rail" aria-label={t("title")}>
          {["pure", "friendly", "moments"].map((id) => (
            <button
              className="mood-chip"
              key={id}
              onClick={() => setNotice(t(id))}
            >
              <Heart
                data-icon-role="metadata"
                data-icon-tone="identity"
                aria-hidden
              />
              {t(id)}
            </button>
          ))}
        </section>
        <Section title={t("feed")} className="wide-panel">
          <Empty>{t("feedEmpty")}</Empty>
        </Section>
        <Section title={t("compass")}>
          <Compass
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("compassBody")}</p>
          <PendingButton onClick={() => setNotice(t("compass"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("circles")}>
          <Users
            data-icon-role="feature"
            className="feature-symbol"
            aria-hidden
          />
          <p>{t("circlesBody")}</p>
          <PendingButton onClick={() => setNotice(t("circles"))}>
            {c("learnMore")}
          </PendingButton>
        </Section>
        <Section title={t("support")} className="support-panel">
          <Heart
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
    </>
  );
}
