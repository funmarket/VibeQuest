"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
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
    setBusy(true);
    setError(false);
    try {
      await reviewActivity("/api", id, {
        rating: Number(data.get("rating")),
        text: String(data.get("text")),
      });
      form.reset();
      setRevision((r) => r + 1);
      await onChange();
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
      {canReview ? (
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label>
              {t("rating")}
              <select name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("reviewText")}
              <textarea name="text" required maxLength={1000} />
            </label>
            <button type="submit">{t("submitReview")}</button>
          </fieldset>
        </form>
      ) : (
        <p>{t("signInReview")}</p>
      )}
      {error && <p role="alert">{t("failed")}</p>}
    </section>
  );
}
