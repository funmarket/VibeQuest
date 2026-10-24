"use client";
import { useEffect, useState, useId, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useHost } from "../../platform/host";
import { activityReviewInputSchema } from "@vq/contracts";
import { readActivityReviews, reviewActivity } from "@vq/api-client";
import type { ActivityReview } from "@vq/contracts";
export function ActivityReviews({
  id,
  canReview,
  onChange,
}: {
  id: string;
  canReview: boolean;
  onChange: () => Promise<void>;
}) {
  const t = useTranslations("activities");
  const locale = useLocale();
  const host = useHost();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<ActivityReview[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    readActivityReviews("/api", id, 0, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setReviews(result.reviews);
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = activityReviewInputSchema.safeParse({
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
      await reviewActivity("/api", id, parsed.data);
      form.reset();
      setRevision((r) => r + 1);
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
      const result = await readActivityReviews("/api", id, next);
      setReviews((items) => [...items, ...result.reviews]);
      setNext(result.nextOffset);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="activity-reviews">
      <h4>{t("reviews")}</h4>
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : (
        <>
          {reviews.length === 0 && <p>{t("noReviews")}</p>}
          {reviews.map((review) => (
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
              <fieldset className="activity-rating">
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
          <p role="alert">{t("failed")}</p>
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
