"use client";
import { useState } from "react";
import { tabKeyboard } from "../../components/tab-keyboard";
import { useTranslations } from "next-intl";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  ShieldCheck,
  Handshake,
  ReceiptText,
} from "lucide-react";
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
              <Wallet size={34} aria-hidden />
              <p className="balance-state">{t("disconnected")}</p>
              <p>{t("balanceBody")}</p>
              <div className="button-row">
                <button
                  className="soft-button"
                  onClick={() => setNotice(t("send"))}
                >
                  <ArrowUpRight size={17} aria-hidden />
                  {t("send")}
                </button>
                <button
                  className="soft-button"
                  onClick={() => setNotice(t("receive"))}
                >
                  <ArrowDownLeft size={17} aria-hidden />
                  {t("receive")}
                </button>
              </div>
            </Section>
            <Section title={t("key")}>
              <KeyRound className="feature-symbol" aria-hidden />
              <Empty>{t("keyBody")}</Empty>
            </Section>
            <Section title={t("ledger")} className="wide-panel">
              <ReceiptText className="feature-symbol" aria-hidden />
              <Empty>{t("ledgerBody")}</Empty>
            </Section>
          </div>
        ) : (
          <Section title={t("tradesTitle")} className="trade-panel">
            <Handshake size={38} aria-hidden />
            <Empty>{t("tradesBody")}</Empty>
            <span className="pending-label">{c("notAvailable")}</span>
          </Section>
        )}
      </div>
      <p className="safety-note">
        <ShieldCheck size={18} aria-hidden />
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
