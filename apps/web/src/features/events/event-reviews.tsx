"use client";
import { useEffect, useState, useId, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useHost } from "../../platform/host";
import { eventReviewInputSchema } from "@vq/contracts";
import type { EventReview } from "@vq/contracts";
import { readEventReviews, reviewEvent } from "@vq/api-client";
export function EventReviews({
  id,
  canReview,
  onChange,
}: {
  id: string;
  canReview: boolean;
  onChange: () => Promise<void>;
}) {
  const t = useTranslations("officialEvents");
  const locale = useLocale();
  const host = useHost();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<EventReview[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    readEventReviews("/api", id, 0, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(result.reviews);
        setNext(result.nextOffset);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const parsed = eventReviewInputSchema.safeParse({
      rating,
      text: String(data.get("text")),
    });
    if (!parsed.success) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      await reviewEvent("/api", id, parsed.data);
      form.reset();
      setRevision((value) => value + 1);
      await onChange();
      setOpen(false);
      setSaved(true);
      host.haptic();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    if (next === null) return;
    setBusy(true);
    try {
      const result = await readEventReviews("/api", id, next);
      setItems((current) => [...current, ...result.reviews]);
      setNext(result.nextOffset);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="event-reviews">
      <h4>{t("reviews")}</h4>
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : (
        <>
          {items.length === 0 && <p>{t("noReviews")}</p>}
          {items.map((review) => (
            <article key={review.id}>
              <strong>
                {review.author} · {"★".repeat(review.rating)}
              </strong>
              <p>{review.text}</p>
              <time dateTime={review.createdAt}>
                {new Date(review.createdAt).toLocaleString(locale)}
              </time>
            </article>
          ))}
          {next !== null && (
            <button onClick={more} disabled={busy}>
              {t("more")}
            </button>
          )}
        </>
      )}
      {canReview && (
        <button
          disabled={busy}
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => {
            host.haptic();
            setOpen(!open);
            setRating(5);
            setSaved(false);
            setError(false);
          }}
        >
          {t(open ? "closeReview" : "evaluate")}
        </button>
      )}
      {canReview ? (
        open && (
          <form id={formId} onSubmit={submit}>
            <fieldset disabled={busy}>
              <fieldset className="event-rating">
                <legend>{t("rating")}</legend>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      aria-label={value + " / 5"}
                      onChange={() => {
                        setRating(value);
                        host.haptic();
                      }}
                    />
                    <span aria-hidden>{value <= rating ? "★" : "☆"}</span>
                  </label>
                ))}
              </fieldset>
              <label>
                {t("reviewText")}
                <textarea name="text" required maxLength={1000} />
              </label>
              <button type="submit">{t("submitReview")}</button>
            </fieldset>
          </form>
        )
      ) : (
        <p>{t("signInReview")}</p>
      )}
      {saved && <p role="status">{t("reviewSaved")}</p>}
      {error && (
        <div>
          <p role="alert">{t("reviewFailed")}</p>
          <button
            disabled={busy}
            onClick={() => setRevision((value) => value + 1)}
          >
            {t("retry")}
          </button>
        </div>
      )}
    </section>
  );
}
