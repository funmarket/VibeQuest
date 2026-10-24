"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { profileRequest, readActivities } from "@vq/api-client";
import type { Activity } from "@vq/contracts";
import { useHost } from "../../platform/host";
import { useAccount } from "../identity/account-provider";
import { ProfileForm } from "../profile/profile-form";
import { tabKeyboard } from "../../components/tab-keyboard";
import { ActivityForm } from "./activity-form";
import { ActivityCard } from "./activity-card";
export function ActivitiesPanel() {
  const t = useTranslations("activities");
  const host = useHost();
  const [message, setMessage] = useState<string | null>(null);
  const { account, loading: accountLoading } = useAccount();
  const [tab, setTab] = useState<"live" | "upcoming">("live");
  const [items, setItems] = useState<Activity[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postingBusy, setPostingBusy] = useState(false);
  const [eligibility, setEligibility] = useState<
    "loading" | "complete" | "incomplete" | "failed"
  >("loading");
  const [profileRevision, setProfileRevision] = useState(0);
  const [moreBusy, setMoreBusy] = useState(false);
  useEffect(() => {
    if (accountLoading) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    readActivities("/api", tab, 0, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.activities);
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
    if (!posting || !account) return;
    let live = true;
    setEligibility("loading");
    profileRequest("/api")
      .then((result) => {
        if (live)
          setEligibility(result.profile?.completed ? "complete" : "incomplete");
      })
      .catch(() => {
        if (live) setEligibility("failed");
      });
    return () => {
      live = false;
    };
  }, [posting, account, profileRevision]);
  // Refresh real server lifecycle classifications when a scheduled gathering reaches its start.
  useEffect(() => {
    const times = items
      .map((item) =>
        item.startsAt ? Date.parse(item.startsAt) - Date.now() : -1,
      )
      .filter((value) => value > 0);
    if (!times.length) return;
    const timer = setTimeout(
      () => setRevision((value) => value + 1),
      Math.min(Math.min(...times) + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [items]);
  async function more() {
    if (next === null) return;
    setMoreBusy(true);
    try {
      const result = await readActivities("/api", tab, next);
      setItems((old) => [
        ...old,
        ...result.activities.filter(
          (item) => !old.some((existing) => existing.id === item.id),
        ),
      ]);
      setNext(result.nextOffset);
    } catch {
      setError(true);
    } finally {
      setMoreBusy(false);
    }
  }
  function changed(item: Activity) {
    if (item.status !== tab) {
      setRevision((value) => value + 1);
    } else
      setItems((old) =>
        old.map((existing) => (existing.id === item.id ? item : existing)),
      );
  }
  return (
    <section className="activities-panel" aria-label={t("live")}>
      <header>
        <div
          className="activity-tabs"
          role="tablist"
          aria-label={t("live")}
          onKeyDown={tabKeyboard}
        >
          {(["live", "upcoming"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              disabled={postingBusy || moreBusy}
              id={`activities-tab-${value}`}
              aria-controls="activities-feed"
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => {
                host.haptic();
                setMessage(null);
                setTab(value);
                setPosting(false);
                setExpanded(null);
              }}
            >
              {t(value)}
            </button>
          ))}
        </div>
        <button
          className="activity-button"
          disabled={postingBusy}
          onClick={() => {
            host.haptic();
            setPosting((value) => !value);
          }}
        >
          {t(posting ? "close" : tab === "live" ? "post" : "schedule")}
        </button>
      </header>
      <p className="activity-intro">
        {t(tab === "live" ? "liveInfo" : "upcomingInfo")}
      </p>
      {posting &&
        (!account ? (
          <p>{t("signIn")}</p>
        ) : eligibility === "loading" ? (
          <p role="status">{t("loading")}</p>
        ) : eligibility === "failed" ? (
          <div>
            <p role="alert">{t("failed")}</p>
            <button onClick={() => setProfileRevision((value) => value + 1)}>
              {t("retry")}
            </button>
          </div>
        ) : eligibility === "incomplete" ? (
          <div>
            <p>{t("incomplete")}</p>
            <ProfileForm />
            <button
              className="activity-button"
              onClick={() => setProfileRevision((value) => value + 1)}
            >
              {t("checkProfile")}
            </button>
          </div>
        ) : (
          <div>
            <ProfileForm />
            <ActivityForm
              onBusy={setPostingBusy}
              tab={tab}
              onSaved={(saved) => {
                setPosting(false);
                setMessage(t("published"));
                setExpanded(saved.id);
                setRevision((value) => value + 1);
              }}
              onClose={() => setPosting(false)}
            />
          </div>
        ))}
      {message && <p role="status">{message}</p>}
      <div
        role="tabpanel"
        id="activities-feed"
        aria-labelledby={`activities-tab-${tab}`}
        aria-busy={loading}
      >
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : error ? (
          <div>
            <p role="alert">{t("failed")}</p>
            <button
              className="activity-button"
              onClick={() => setRevision((value) => value + 1)}
            >
              {t("retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p>{t("empty")}</p>
        ) : (
          items.map((item) => (
            <ActivityCard
              key={item.id}
              activity={item}
              expanded={expanded === item.id}
              onToggle={() => {
                host.haptic();
                setExpanded((value) => (value === item.id ? null : item.id));
              }}
              onChange={changed}
            />
          ))
        )}
        {!loading && !error && next !== null && (
          <button
            className="activity-button"
            disabled={moreBusy}
            onClick={more}
          >
            {t(moreBusy ? "loading" : "more")}
          </button>
        )}
      </div>
    </section>
  );
}
