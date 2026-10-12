"use client";
import { useState } from "react";
import { tabKeyboard } from "../../components/tab-keyboard";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  ShieldCheck,
  Handshake,
  ReceiptText,
} from "lucide-react";
import { WalletGlyph } from "../../components/icon-glyphs";
import {
  Section,
  Empty,
  NoticeDialog,
  PageEnd,
} from "../../components/presentation";

export function PursePage() {
  const t = useTranslations("purse");
  const c = useTranslations("common");
  const [tab, setTab] = useState<"wallet" | "p2p">("wallet");
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">VQ</span>
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <div
        className="tab-rail purse-rail"
        role="tablist"
        onKeyDown={tabKeyboard}
        aria-label={t("title")}
      >
        {(["wallet", "p2p"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            tabIndex={tab === id ? 0 : -1}
            data-tab={id}
            id={`purse-${id}`}
            aria-selected={tab === id}
            aria-controls="purse-view"
            onClick={() => setTab(id)}
          >
            {t(id)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="purse-view" aria-labelledby={`purse-${tab}`}>
        {tab === "wallet" ? (
          <div className="purse-grid">
            <Section title={t("balance")} className="wallet-card">
              <WalletGlyph data-icon-role="feature" aria-hidden />
              <p className="balance-state">{t("disconnected")}</p>
              <p>{t("balanceBody")}</p>
              <div className="button-row">
                <button
                  className="soft-button"
                  onClick={() => setNotice(t("send"))}
                >
                  <ArrowUpRight
                    data-icon-role="action"
                    data-icon-tone="identity"
                    aria-hidden
                  />
                  {t("send")}
                </button>
                <button
                  className="soft-button"
                  onClick={() => setNotice(t("receive"))}
                >
                  <ArrowDownLeft
                    data-icon-role="action"
                    data-icon-tone="identity"
                    aria-hidden
                  />
                  {t("receive")}
                </button>
              </div>
            </Section>
            <Section title={t("key")}>
              <KeyRound
                data-icon-role="feature"
                className="feature-symbol"
                aria-hidden
              />
              <Empty>{t("keyBody")}</Empty>
            </Section>
            <Section title={t("ledger")} className="wide-panel">
              <ReceiptText
                data-icon-role="feature"
                className="feature-symbol"
                aria-hidden
              />
              <Empty>{t("ledgerBody")}</Empty>
            </Section>
          </div>
        ) : (
          <Section title={t("tradesTitle")} className="trade-panel">
            <Handshake data-icon-role="illustration" aria-hidden />
            <Empty>{t("tradesBody")}</Empty>
            <span className="pending-label">{c("notAvailable")}</span>
          </Section>
        )}
      </div>
      <p className="safety-note">
        <ShieldCheck data-icon-role="action" aria-hidden />
        {t("safety")}
      </p>
      <PageEnd />
      {notice && (
        <NoticeDialog title={notice} onClose={() => setNotice(null)}>
          <p>{t("balanceBody")}</p>
          <p>{c("notAvailable")}</p>
        </NoticeDialog>
      )}
    </>
  );
}
