"use client";
import { useState } from "react";
import { ConnectionsPanel } from "../social/connections-panel";
import { GossipPanel } from "../content/gossip";
import { GossipComposer } from "../content/composer";
import { useAccount } from "../identity/account-provider";
import type { GossipTextPost } from "@vq/contracts";
import { tabKeyboard } from "../../components/tab-keyboard";
import { useTranslations } from "next-intl";
import {
  Camera,
  MessageCircle,
  Users,
  Footprints,
  Blend,
  MessagesSquare,
  Inbox,
  UserRoundPlus,
  Volume2,
} from "lucide-react";
import {
  Empty,
  Section,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

const tabs = ["gossip", "drift", "vibes", "orbit", "echo", "pulls"] as const;
const icons = {
  gossip: MessagesSquare,
  drift: Footprints,
  vibes: Blend,
  orbit: UserRoundPlus,
  echo: Users,
  pulls: Inbox,
};
export function VibePage() {
  const t = useTranslations("vibe");
  const c = useTranslations("common");
  const [tab, setTab] = useState<(typeof tabs)[number]>("gossip");
  const [notice, setNotice] = useState<string | null>(null);
  const { account } = useAccount();
  const [composer, setComposer] = useState(false),
    [editing, setEditing] = useState<GossipTextPost | undefined>(),
    [revision, setRevision] = useState(0);
  const Glyph = icons[tab];
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">{c("brandTagline")}</span>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div className="vibe-capsule">
        <button
          className="capsule-dial"
          aria-label={t("camera")}
          onClick={() => setNotice(t("camera"))}
        >
          <Camera data-icon-role="feature" aria-hidden />
        </button>
        <button
          className="capsule-title"
          onClick={() => {
            setEditing(undefined);
            setComposer(true);
          }}
        >
          {t("share")}
          <small className="sr-only">{t("composer")}</small>
        </button>
        <button
          className="capsule-dial"
          aria-label={t("chat")}
          onClick={() => setNotice(t("chat"))}
        >
          <MessageCircle data-icon-role="feature" aria-hidden />
        </button>
      </div>
      <blockquote className="vibe-quote">
        <p>“{t("quote")}”</p>
        <cite>{t("quoteBy")}</cite>
      </blockquote>
      <div
        className="tab-rail vibe-rail"
        role="tablist"
        onKeyDown={tabKeyboard}
        aria-label={t("title")}
      >
        {tabs.map((id) => (
          <button
            key={id}
            id={`vibe-${id}`}
            data-tab={id}
            role="tab"
            tabIndex={tab === id ? 0 : -1}
            aria-selected={tab === id}
            aria-controls="vibe-view"
            onClick={() => setTab(id)}
          >
            {t(id)}
          </button>
        ))}
      </div>
      <section
        className={`panel vibe-view${tab === "orbit" || tab === "echo" ? " social-view" : tab === "gossip" ? " gossip-view" : ""}`}
        data-feature={tab}
        role="tabpanel"
        id="vibe-view"
        aria-labelledby={`vibe-${tab}`}
      >
        {tab === "gossip" ? (
          <GossipPanel
            key={`${account?.id ?? "guest"}:${revision}`}
            onRefresh={() => setRevision((v) => v + 1)}
            onEdit={(post) => {
              setEditing(post);
              setComposer(true);
            }}
          />
        ) : tab === "orbit" || tab === "echo" ? (
          <ConnectionsPanel
            key={tab}
            side={tab === "orbit" ? "following" : "followers"}
            onDrift={() => setTab("drift")}
          />
        ) : (
          <>
            <span className="empty-emblem">
              <Glyph data-icon-role="feature" aria-hidden />
            </span>
            <h2>{t(`${tab}Title`)}</h2>
            <Empty>{t(`${tab}Body`)}</Empty>
            <span className="pending-label">{c("notAvailable")}</span>
          </>
        )}
      </section>
      <Section title={t("sound")}>
        <Volume2
          data-icon-role="feature"
          className="feature-symbol"
          aria-hidden
        />
        <Empty>{t("soundBody")}</Empty>
      </Section>
      <PageEnd />
      {composer && (
        <GossipComposer
          key={editing?.id ?? "new"}
          post={editing}
          onClose={() => setComposer(false)}
          onSaved={() => {
            setComposer(false);
            setTab("gossip");
            setRevision((v) => v + 1);
          }}
        />
      )}
      {notice && (
        <NoticeDialog title={notice} onClose={() => setNotice(null)}>
          <p>{c("notAvailable")}</p>
        </NoticeDialog>
      )}
    </>
  );
}
