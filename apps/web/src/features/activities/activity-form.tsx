"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  postActivity,
  editActivity,
  uploadImage,
  deleteMedia,
  ActivityRequestError,
} from "@vq/api-client";
import { activityInputSchema, type Activity } from "@vq/contracts";
import { useHost } from "../../platform/host";
export function ActivityForm({
  tab,
  activity,
  onSaved,
  onClose,
  onBusy,
  onReload,
}: {
  tab: "live" | "upcoming";
  activity?: Activity;
  onSaved: (activity: Activity) => void;
  onClose: () => void;
  onBusy?: (busy: boolean) => void;
  onReload?: () => Promise<void>;
}) {
  const t = useTranslations("activities");
  const host = useHost();
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaIds, setMediaIds] = useState(activity?.mediaIds ?? []);
  const localDate = activity?.startsAt
    ? new Date(
        Date.parse(activity.startsAt) -
          new Date(activity.startsAt).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data
      .getAll("images")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );
    if (files.length + mediaIds.length > 4) {
      setError(t("mediaLimit"));
      return;
    }
    const date =
      tab === "upcoming" ? new Date(String(data.get("startsAt"))) : null;
    if (date && !Number.isFinite(date.getTime())) {
      setError(t("invalidSchedule"));
      return;
    }
    const parsed = activityInputSchema.safeParse({
      title: String(data.get("title")),
      description: String(data.get("description")),
      location: String(data.get("location")),
      emoji: String(data.get("emoji")),
      startsAt: date ? date.toISOString() : (activity?.startsAt ?? null),
      mediaIds,
    });
    if (!parsed.success) {
      setError(t("invalidDetails"));
      return;
    }
    setBusy(true);
    onBusy?.(true);
    setError(null);
    setConflict(false);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const image = await uploadImage("/api", file, "public");
        uploaded.push(image.id);
      }
      const input = { ...parsed.data, mediaIds: [...mediaIds, ...uploaded] };
      const saved = activity
        ? await editActivity("/api", activity.id, {
            ...input,
            version: activity.version,
          })
        : await postActivity("/api", input);
      host.haptic();
      onSaved(saved);
    } catch (cause) {
      setConflict(
        cause instanceof ActivityRequestError &&
          cause.code === "ACTIVITY_CONFLICT",
      );
      setError(
        t(
          cause instanceof ActivityRequestError &&
            cause.code === "PROFILE_INCOMPLETE"
            ? "incomplete"
            : cause instanceof ActivityRequestError &&
                cause.code === "ACTIVITY_CONFLICT"
              ? "conflict"
              : cause instanceof ActivityRequestError &&
                  cause.code === "INVALID_SCHEDULE"
                ? "invalidSchedule"
                : "failed",
        ),
      );
      // Delete only newly uploaded, unattached objects. Media's FK guard protects a committed activity if its response was lost.
      for (const id of uploaded)
        await deleteMedia("/api", id).catch(() => {
          setError(t("cleanupFailed"));
        });
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <form className="activity-form" onSubmit={submit}>
      <h3>{t(activity ? "edit" : tab === "live" ? "post" : "schedule")}</h3>
      <fieldset disabled={busy}>
        <label>
          {t("title")}
          <input
            name="title"
            defaultValue={activity?.title ?? ""}
            required
            maxLength={160}
          />
        </label>
        <label>
          {t("description")}
          <textarea
            name="description"
            defaultValue={activity?.description ?? ""}
            maxLength={2000}
            rows={3}
          />
        </label>
        <label>
          {t("location")}
          <input
            name="location"
            defaultValue={activity?.location ?? ""}
            required
            maxLength={200}
          />
        </label>
        {tab === "upcoming" && (
          <label>
            {t("date")}
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={localDate}
              required
            />
          </label>
        )}
        <label>
          {t("indicator")}
          <select
            name="emoji"
            defaultValue={activity?.emoji ?? "🎵"}
            onChange={() => host.haptic()}
          >
            {activityInputSchema.shape.emoji.options.map((emoji, i) => (
              <option value={emoji} key={emoji}>
                {emoji} {t(`category${i}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("images")}
          <input
            name="images"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
          />
        </label>
        <p>{t("mediaHint")}</p>
        <div className="activity-media">
          {mediaIds.map((id) => (
            <div key={id}>
              <img
                src={`/api/v1/media/${id}/thumbnail`}
                width={64}
                height={64}
                alt={t("image")}
              />
              <button
                type="button"
                onClick={() =>
                  setMediaIds((ids) => ids.filter((value) => value !== id))
                }
              >
                {t("removeImage")}
              </button>
            </div>
          ))}
        </div>
        <div className="activity-actions">
          <button type="submit">
            {t(
              busy
                ? "loading"
                : activity
                  ? "saveChanges"
                  : tab === "live"
                    ? "publish"
                    : "schedule",
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              host.haptic();
              onClose();
            }}
          >
            {t("close")}
          </button>
        </div>
      </fieldset>
      {busy && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{error}</p>}
      {conflict && onReload && (
        <button
          type="button"
          className="activity-button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            onBusy?.(true);
            try {
              await onReload();
            } catch {
              setError(t("failed"));
            } finally {
              setBusy(false);
              onBusy?.(false);
            }
          }}
        >
          {t("reload")}
        </button>
      )}
    </form>
  );
}
