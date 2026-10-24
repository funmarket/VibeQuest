"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { myBusinesses, readEvents } from "@vq/api-client";
import type { Business, OfficialEvent } from "@vq/contracts";
import { useHost } from "../../platform/host";
import { useAccount } from "../identity/account-provider";
import { tabKeyboard } from "../../components/tab-keyboard";
import { EventForm } from "./event-form";
import { EventCard } from "./event-card";
export function EventsPanel() {
  const t = useTranslations("officialEvents");
  const host = useHost();
  const [message, setMessage] = useState<string | null>(null);
  const { account, loading: accountLoading } = useAccount();
  const [tab, setTab] = useState<"live" | "upcoming">("live");
  const [items, setItems] = useState<OfficialEvent[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hosting, setHosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [hostsLoading, setHostsLoading] = useState(true);
  const [hostsError, setHostsError] = useState(false);
  useEffect(() => {
    if (accountLoading) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    readEvents("/api", tab, 0, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.events);
        setNext(result.nextOffset);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, revision, account?.id, accountLoading]);
  useEffect(() => {
    if (!hosting || !account) return;
    let live = true;
    setHostsLoading(true);
    setHostsError(false);
    myBusinesses("/api")
      .then((items) => {
        if (live) setBusinesses(items.filter((item) => item.canHostEvents));
      })
      .catch(() => {
        if (live) setHostsError(true);
      })
      .finally(() => {
        if (live) setHostsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [hosting, account?.id, revision]);
  useEffect(() => {
    const times = items
      .map((item) =>
        item.startsAt ? Date.parse(item.startsAt) - Date.now() : -1,
      )
      .filter((time) => time > 0);
    if (!times.length) return;
    const timer = setTimeout(
      () => setRevision((value) => value + 1),
      Math.min(Math.min(...times) + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [items]);
  async function more() {
    if (next === null) return;
    setBusy(true);
    try {
      const result = await readEvents("/api", tab, next);
      setItems((current) => [
        ...current,
        ...result.events.filter(
          (item) => !current.some((old) => old.id === item.id),
        ),
      ]);
      setNext(result.nextOffset);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  function changed(event: OfficialEvent) {
    if (event.status !== tab) setRevision((value) => value + 1);
    else
      setItems((current) =>
        current.map((item) => (item.id === event.id ? event : item)),
      );
  }
  return (
    <section className="events-panel" aria-label={t("live")}>
      <header>
        <div
          className="event-tabs"
          role="tablist"
          aria-label={t("live")}
          onKeyDown={tabKeyboard}
        >
          {(["live", "upcoming"] as const).map((value) => (
            <button
              key={value}
              disabled={busy}
              role="tab"
              id={`events-tab-${value}`}
              aria-controls="events-feed"
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => {
                host.haptic();
                setMessage(null);
                setTab(value);
                setHosting(false);
                setExpanded(null);
              }}
            >
              {t(value)}
            </button>
          ))}
        </div>
        <button
          className="event-button"
          disabled={busy}
          onClick={() => {
            host.haptic();
            setHosting((value) => !value);
          }}
        >
          {t(hosting ? "close" : "host")}
        </button>
      </header>
      <p className="event-intro">{t("info")}</p>
      {hosting &&
        (!account ? (
          <p>{t("signInHost")}</p>
        ) : hostsLoading ? (
          <p role="status">{t("loading")}</p>
        ) : hostsError ? (
          <div>
            <p role="alert">{t("failed")}</p>
            <button onClick={() => setRevision((value) => value + 1)}>
              {t("retry")}
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <p>{t("locked")}</p>
        ) : (
          <EventForm
            tab={tab}
            businesses={businesses}
            onBusy={setBusy}
            onSaved={(event) => {
              setHosting(false);
              setMessage(t("published"));
              setExpanded(event.id);
              setRevision((value) => value + 1);
            }}
            onClose={() => setHosting(false)}
          />
        ))}
      {message && <p role="status">{message}</p>}
      <div
        id="events-feed"
        role="tabpanel"
        aria-labelledby={`events-tab-${tab}`}
        aria-busy={loading}
      >
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : error ? (
          <div>
            <p role="alert">{t("failed")}</p>
            <button
              className="event-button"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t("retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p>{t("empty")}</p>
        ) : (
          items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              expanded={expanded === event.id}
              onToggle={() => {
                host.haptic();
                setExpanded((value) => (value === event.id ? null : event.id));
              }}
              onChange={changed}
            />
          ))
        )}
        {!loading && !error && next !== null && (
          <button className="event-button" disabled={busy} onClick={more}>
            {t(busy ? "loading" : "more")}
          </button>
        )}
      </div>
    </section>
  );
}
