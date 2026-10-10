"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Activity } from "@vq/contracts";
import { cancelActivity, saveActivity, readActivity } from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { ActivityForm } from "./activity-form";
import { ActivityReviews } from "./activity-reviews";
export function ActivityCard({
  activity,
  expanded,
  onToggle,
  onChange,
}: {
  activity: Activity;
  expanded: boolean;
  onToggle: () => void;
  onChange: (activity: Activity) => void;
}) {
  const t = useTranslations("activities");
  const locale = useLocale();
  const { account } = useAccount();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const owned = account?.id === activity.ownerId;
  async function refresh() {
    onChange(await readActivity("/api", activity.id));
  }
  async function action(cancel: boolean) {
    setBusy(true);
    setError(false);
    try {
      if (cancel) {
        onChange(await cancelActivity("/api", activity.id, activity.version));
        setConfirmCancel(false);
      } else {
        await saveActivity("/api", activity.id, !activity.saved);
        await refresh();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className={`activity-card${expanded ? " expanded" : ""}`}
      data-activity-id={activity.id}
    >
      <button
        className="activity-summary"
        disabled={busy}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`activity-${activity.id}`}
      >
        {activity.mediaIds[0] ? (
          <img
            src={`/api/v1/media/${activity.mediaIds[0]}/thumbnail`}
            width={44}
            height={44}
            alt={activity.title}
          />
        ) : (
          <span className="activity-emoji" aria-hidden>
            {activity.emoji}
          </span>
        )}
        <span className="activity-summary-text">
          <strong>{activity.title}</strong>
          <small>
            {activity.location} · {activity.emoji}{" "}
            {t(activity.startsAt ? "casual" : "stream")}
          </small>
          {activity.startsAt && (
            <time dateTime={activity.startsAt}>
              {new Date(activity.startsAt).toLocaleString(locale)}
            </time>
          )}
        </span>
        <span className="activity-expand">
          {t(expanded ? "collapse" : "expand")} {expanded ? "▴" : "▾"}
        </span>
      </button>
      {expanded && (
        <div id={`activity-${activity.id}`} className="activity-details">
          <dl>
            <div>
              <dt>{t("reporter")}</dt>
              <dd>{activity.author}</dd>
            </div>
            <div>
              <dt>{t("location")}</dt>
              <dd>{activity.location}</dd>
            </div>
          </dl>
          <p>{activity.description}</p>
          <p>{t("openAccess")}</p>
          <div className="activity-media">
            {activity.mediaIds.map((id) => (
              <a
                href={`/api/v1/media/${id}/image`}
                key={id}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/api/v1/media/${id}/thumbnail`}
                  width={160}
                  height={160}
                  alt={activity.title}
                />
              </a>
            ))}
          </div>
          <div className="activity-actions">
            <a
              className="activity-button"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activity.title} ${activity.location}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("directions")}
            </a>
            {account ? (
              <button
                disabled={busy}
                onClick={() => action(false)}
                aria-pressed={activity.saved}
              >
                {t(activity.saved ? "unsave" : "save")}
              </button>
            ) : (
              <p>{t("signInSave")}</p>
            )}
          </div>
          <p className="activity-note">{t("saveHint")}</p>
          {owned && activity.status !== "cancelled" && (
            <div className="activity-actions">
              <button
                disabled={busy}
                onClick={() => setEditing((value) => !value)}
              >
                {t("edit")}
              </button>
              <button disabled={busy} onClick={() => setConfirmCancel(true)}>
                {t("cancelActivity")}
              </button>
            </div>
          )}
          {confirmCancel && (
            <div>
              <p>{t("cancelConfirm")}</p>
              <div className="activity-actions">
                <button disabled={busy} onClick={() => action(true)}>
                  {t("confirmCancel")}
                </button>
                <button disabled={busy} onClick={() => setConfirmCancel(false)}>
                  {t("keep")}
                </button>
              </div>
            </div>
          )}
          {editing && (
            <ActivityForm
              onBusy={setBusy}
              tab={activity.status === "upcoming" ? "upcoming" : "live"}
              activity={activity}
              onSaved={(saved) => {
                onChange(saved);
                setEditing(false);
              }}
              onClose={() => setEditing(false)}
            />
          )}
          {activity.startsAt && (
            <>
              <p>
                {t("rating")}:{" "}
                {activity.reviewCount
                  ? `${activity.rating.toFixed(1)} / 5 · ${activity.reviewCount}`
                  : t("noReviews")}
              </p>
              <ActivityReviews
                id={activity.id}
                canReview={!!account && activity.status !== "cancelled"}
                onChange={refresh}
              />
            </>
          )}
          {error && <p role="alert">{t("conflict")}</p>}
        </div>
      )}
    </article>
  );
}
