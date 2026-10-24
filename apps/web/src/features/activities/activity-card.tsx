"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useHost } from "../../platform/host";
import { activityExploreHref } from "../explore/navigation";
import { activityInputSchema, type Activity } from "@vq/contracts";
import {
  cancelActivity,
  saveActivity,
  readActivity,
  ActivityRequestError,
} from "@vq/api-client";
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
  const router = useRouter();
  const host = useHost();
  const { account } = useAccount();
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const owned = account?.id === activity.ownerId;
  async function refresh() {
    onChange(await readActivity("/api", activity.id));
  }
  async function action(cancel: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (cancel) {
        onChange(await cancelActivity("/api", activity.id, activity.version));
        setConfirmCancel(false);
      } else {
        await saveActivity("/api", activity.id, !activity.saved);
        await refresh();
        setMessage(t(activity.saved ? "removedSave" : "saved"));
      }
      host.haptic();
    } catch (cause) {
      setError(
        t(
          cause instanceof ActivityRequestError &&
            cause.code === "ACTIVITY_CONFLICT"
            ? "conflict"
            : "failed",
        ),
      );
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
        onClick={() => {
          setEditing(false);
          setConfirmCancel(false);
          setError(null);
          setMessage(null);
          onToggle();
        }}
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
              <dt>{t("indicator")}</dt>
              <dd>
                {activity.emoji}{" "}
                <span>
                  {t(
                    `category${activityInputSchema.shape.emoji.options.indexOf(activity.emoji)}`,
                  )}
                </span>
              </dd>
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
              onClick={() => {
                host.haptic();
                router.push(activityExploreHref(locale, activity));
              }}
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
                onClick={() => {
                  host.haptic();
                  setConfirmCancel(false);
                  setEditing((value) => !value);
                }}
              >
                {t("edit")}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  host.haptic();
                  setEditing(false);
                  setConfirmCancel(true);
                }}
              >
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
                <button
                  disabled={busy}
                  onClick={() => {
                    host.haptic();
                    setConfirmCancel(false);
                  }}
                >
                  {t("keep")}
                </button>
              </div>
            </div>
          )}
          {editing && (
            <ActivityForm
              onBusy={setBusy}
              onReload={async () => {
                await refresh();
                setEditing(false);
              }}
              tab={activity.status === "upcoming" ? "upcoming" : "live"}
              activity={activity}
              onSaved={(saved) => {
                onChange(saved);
                setEditing(false);
                setMessage(t("updated"));
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
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </article>
  );
}
