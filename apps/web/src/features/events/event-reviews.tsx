"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
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
    setBusy(true);
    setError(false);
    try {
      await reviewEvent("/api", id, {
        rating: Number(data.get("rating")),
        text: String(data.get("text")),
      });
      form.reset();
      setRevision((value) => value + 1);
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
      {error && <p role="alert">{t("reviewFailed")}</p>}
    </section>
  );
}
