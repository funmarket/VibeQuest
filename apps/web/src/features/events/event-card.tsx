"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { eventExploreHref } from "../explore/navigation";
import { useHost } from "../../platform/host";
import type { OfficialEvent } from "@vq/contracts";
import {
  readEvent,
  rsvpEvent,
  cancelEvent,
  saveEvent,
  EventRequestError,
} from "@vq/api-client";
import { useAccount } from "../identity/account-provider";
import { EventForm } from "./event-form";
import { EventReviews } from "./event-reviews";
export function EventCard({
  event,
  expanded,
  onToggle,
  onChange,
}: {
  event: OfficialEvent;
  expanded: boolean;
  onToggle: () => void;
  onChange: (event: OfficialEvent) => void;
}) {
  const t = useTranslations("officialEvents");
  const locale = useLocale();
  const router = useRouter();
  const host = useHost();
  const ratingText = event.reviewCount
    ? `${event.rating.toFixed(1)} / 5 · ${event.reviewCount}`
    : t("noReviews");
  const { account } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const owned = account?.id === event.ownerId;
  async function refresh() {
    onChange(await readEvent("/api", event.id));
  }
  async function action(kind: "cancel" | "rsvp" | "save") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (kind === "cancel") {
        onChange(await cancelEvent("/api", event.id, event.version));
        setConfirm(false);
      } else {
        if (kind === "save") await saveEvent("/api", event.id, !event.saved);
        else await rsvpEvent("/api", event.id, !event.going);
        await refresh();
        setMessage(
          t(
            kind === "save"
              ? event.saved
                ? "bookmarkRemoved"
                : "bookmarkSaved"
              : event.going
                ? "rsvpRemoved"
                : "rsvpAdded",
          ),
        );
      }
      host.haptic();
    } catch (cause) {
      setError(
        t(
          cause instanceof EventRequestError && cause.code === "EVENT_CONFLICT"
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
      className={`event-card${expanded ? " expanded" : ""}`}
      data-event-id={event.id}
    >
      <button
        className="event-summary"
        onClick={() => {
          setEditing(false);
          setConfirm(false);
          setError(null);
          setMessage(null);
          onToggle();
        }}
        disabled={busy}
        aria-expanded={expanded}
        aria-controls={`event-${event.id}`}
      >
        {event.mediaIds[0] ? (
          <img
            src={`/api/v1/media/${event.mediaIds[0]}/thumbnail`}
            width={48}
            height={48}
            alt={event.title}
          />
        ) : (
          <span className="event-category-icon" aria-hidden>
            {{ music: "🎵", art: "🎨", cafe: "☕", theatre: "🎭" }[event.tag]}
          </span>
        )}
        <span className="event-summary-text">
          <strong>{event.title}</strong>
          <small>{event.location}</small>
          <small>
            {t("hostLabel")} {event.hostName}
          </small>
          <span>
            {t(event.status === "live" ? "liveNow" : "upcoming")} ·{" "}
            {t(event.tag)}
          </span>
          <span>
            {t("rating")}: {ratingText}
          </span>
          {event.going && (
            <span className="event-going">{t("goingCount")}</span>
          )}
          {event.startsAt && (
            <time dateTime={event.startsAt}>
              {new Date(event.startsAt).toLocaleString(locale)}
            </time>
          )}
        </span>
        <span className="event-expand">
          {t(expanded ? "collapse" : "expand")} {expanded ? "▴" : "▾"}
        </span>
      </button>
      {expanded && (
        <div className="event-details" id={`event-${event.id}`}>
          <p>{event.description}</p>
          <div className="event-media">
            {event.mediaIds.map((id) => (
              <a
                key={id}
                href={`/api/v1/media/${id}/image`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/api/v1/media/${id}/thumbnail`}
                  width={160}
                  height={160}
                  alt={event.title}
                />
              </a>
            ))}
          </div>
          <p>
            {t("goingCount")}: {event.rsvpCount}
          </p>
          <div className="event-actions">
            {account ? (
              <button
                disabled={busy}
                aria-pressed={event.going}
                onClick={() => action("rsvp")}
              >
                {t(event.going ? "cancelRsvp" : "rsvp")}
              </button>
            ) : (
              <p>{t("signInRsvp")}</p>
            )}
            {account ? (
              <button
                disabled={busy}
                aria-pressed={event.saved}
                onClick={() => action("save")}
              >
                {t(event.saved ? "saved" : "save")}
              </button>
            ) : (
              <p>{t("signInSave")}</p>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.title} ${event.location}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                host.haptic();
                router.push(eventExploreHref(locale, event));
              }}
            >
              {t("directions")}
            </a>
          </div>
          <p className="event-note">{t("rsvpHint")}</p>
          {owned && event.status !== "cancelled" && (
            <div className="event-actions">
              <button
                disabled={busy}
                onClick={() => {
                  host.haptic();
                  setConfirm(false);
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
                  setConfirm(true);
                }}
              >
                {t("cancelEvent")}
              </button>
            </div>
          )}
          {confirm && (
            <div>
              <p>{t("cancelConfirm")}</p>
              <div className="event-actions">
                <button disabled={busy} onClick={() => action("cancel")}>
                  {t("confirmCancel")}
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    host.haptic();
                    setConfirm(false);
                  }}
                >
                  {t("keep")}
                </button>
              </div>
            </div>
          )}
          {editing && (
            <EventForm
              tab={event.status === "upcoming" ? "upcoming" : "live"}
              businesses={[]}
              event={event}
              onBusy={setBusy}
              onReload={async () => {
                await refresh();
                setEditing(false);
              }}
              onSaved={(saved) => {
                onChange(saved);
                setEditing(false);
                setMessage(t("updated"));
              }}
              onClose={() => setEditing(false)}
            />
          )}
          <p>
            {t("rating")}: {ratingText}
          </p>
          <EventReviews
            id={event.id}
            canReview={!!account && event.status !== "cancelled"}
            onChange={refresh}
          />
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </article>
  );
}
