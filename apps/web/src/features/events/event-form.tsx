"use client";
import { useState, useId, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Business, OfficialEvent } from "@vq/contracts";
import {
  postEvent,
  editEvent,
  uploadImage,
  deleteMedia,
  EventRequestError,
} from "@vq/api-client";
export function EventForm({
  tab,
  businesses,
  event,
  onSaved,
  onClose,
  onBusy,
}: {
  tab: "live" | "upcoming";
  businesses: Business[];
  event?: OfficialEvent;
  onSaved: (event: OfficialEvent) => void;
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const t = useTranslations("officialEvents");
  const descriptionId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ids, setIds] = useState(event?.mediaIds ?? []);
  const date = event?.startsAt
    ? new Date(
        Date.parse(event.startsAt) -
          new Date(event.startsAt).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const files = data
      .getAll("images")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );
    if (files.length + ids.length > 4) {
      setError(t("mediaLimit"));
      return;
    }
    setBusy(true);
    onBusy(true);
    setError(null);
    const uploaded: string[] = [];
    try {
      for (const file of files)
        uploaded.push((await uploadImage("/api", file, "public")).id);
      const input = {
        businessId: event?.businessId ?? String(data.get("businessId")),
        title: String(data.get("title")),
        description: String(data.get("description")),
        location: String(data.get("location")),
        tag: String(data.get("tag")) as OfficialEvent["tag"],
        startsAt:
          tab === "upcoming"
            ? new Date(String(data.get("startsAt"))).toISOString()
            : (event?.startsAt ?? null),
        mediaIds: [...ids, ...uploaded],
      };
      onSaved(
        event
          ? await editEvent("/api", event.id, {
              ...input,
              version: event.version,
            })
          : await postEvent("/api", input),
      );
    } catch (cause) {
      setError(
        t(
          cause instanceof EventRequestError && cause.code === "EVENT_FORBIDDEN"
            ? "locked"
            : cause instanceof EventRequestError &&
                cause.code === "EVENT_CONFLICT"
              ? "conflict"
              : "failed",
        ),
      );
      for (const id of uploaded)
        await deleteMedia("/api", id).catch(() => setError(t("cleanupFailed")));
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form className="event-form" onSubmit={submit}>
      <h3>{t(event ? "edit" : "host")}</h3>
      <fieldset disabled={busy}>
        {!event && (
          <label>
            {t("business")}
            <select name="businessId" required>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t("title")}
          <input
            name="title"
            defaultValue={event?.title ?? ""}
            required
            maxLength={160}
          />
        </label>
        <label htmlFor={descriptionId}>{t("description")}</label>
        <textarea
          id={descriptionId}
          name="description"
          defaultValue={event?.description ?? ""}
          rows={3}
          maxLength={2000}
        />
        <label>
          {t("location")}
          <input
            name="location"
            defaultValue={event?.location ?? ""}
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
              defaultValue={date}
              required
            />
          </label>
        )}
        <label>
          {t("category")}
          <select name="tag" defaultValue={event?.tag ?? "music"}>
            {["music", "art", "cafe", "theatre"].map((tag) => (
              <option key={tag} value={tag}>
                {t(tag)}
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
        <div className="event-media">
          {ids.map((id) => (
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
                  setIds((current) => current.filter((value) => value !== id))
                }
              >
                {t("removeImage")}
              </button>
            </div>
          ))}
        </div>
        <div className="event-actions">
          <button type="submit">
            {t(busy ? "loading" : event ? "saveChanges" : "publish")}
          </button>
          <button type="button" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </fieldset>
      {busy && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
