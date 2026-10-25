"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  reportReasonIds,
  type ContentCursor,
  type ModerationCase,
} from "@vq/contracts";
import {
  reportGossip,
  readModerationCases,
  readModerationEvidence,
  decideModerationCase,
  ContentRequestError,
} from "@vq/api-client";

export function GossipReportForm({
  postId,
  commentId,
  onSent,
  onClose,
}: {
  postId: string;
  commentId?: string;
  onSent: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("content"),
    [reason, setReason] = useState<(typeof reportReasonIds)[number] | "">(""),
    [details, setDetails] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <form
      className="gossip-report"
      onSubmit={(event) => {
        event.preventDefault();
        if (!reason || busy) return;
        setBusy(true);
        setError(null);
        reportGossip("/api", postId, { reason, details }, commentId)
          .then(onSent)
          .catch((error) =>
            setError(
              t(
                error instanceof ContentRequestError &&
                  error.code === "REPORT_CLOSED"
                  ? "reportClosed"
                  : "failed",
              ),
            ),
          )
          .finally(() => setBusy(false));
      }}
    >
      <label>
        {t("reportReason")}
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
          required
          disabled={busy}
        >
          <option value="" disabled>
            {t("chooseReason")}
          </option>
          {reportReasonIds.map((id) => (
            <option key={id} value={id}>
              {t(`reason_${id}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("reportDetails")}
        <textarea
          value={details}
          maxLength={1000}
          disabled={busy}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      <button disabled={busy || !reason}>{t("sendReport")}</button>
      <button disabled={busy} type="button" onClick={onClose}>
        {t("cancel")}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function GossipModeration({ onDecided }: { onDecided: () => void }) {
  const t = useTranslations("content"),
    [reports, setReports] = useState<ModerationCase[]>([]),
    [cursor, setCursor] = useState<ContentCursor | null>(null),
    [selected, setSelected] = useState<Awaited<
      ReturnType<typeof readModerationEvidence>
    > | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    readModerationCases("/api")
      .then((r) => {
        if (live) {
          setReports(r.reports);
          setCursor(r.nextCursor);
        }
      })
      .catch(() => {
        if (live) setError(true);
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function action(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await work();
    } catch {
      setSelected(null);
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="gossip-moderation">
      <h3>{t("moderation")}</h3>
      {error && <p role="alert">{t("failed")}</p>}
      {reports.map((report) => (
        <button
          disabled={busy}
          key={report.id}
          onClick={() =>
            void action(async () =>
              setSelected(await readModerationEvidence("/api", report.id)),
            )
          }
        >
          {report.id} ·{" "}
          {t(report.status === "pending" ? "pendingCase" : "decidedCase")}
        </button>
      ))}
      {cursor && (
        <button
          disabled={busy}
          onClick={() =>
            void action(async () => {
              const r = await readModerationCases("/api", cursor);
              setReports((old) => [...old, ...r.reports]);
              setCursor(r.nextCursor);
            })
          }
        >
          {t("more")}
        </button>
      )}
      {selected && (
        <div>
          <h4>{t("reviewEvidence")}</h4>
          <p>{t(`reason_${selected.reason}`)}</p>
          <p>{selected.details}</p>
          <pre>{JSON.stringify(selected.evidence, null, 2)}</pre>
          <p>
            {t("evidenceUntil")}:{" "}
            <time dateTime={selected.report.evidenceExpiresAt}>
              {selected.report.evidenceExpiresAt}
            </time>
          </p>
          {selected.report.status === "pending" &&
            (["hide", "remove"] as const).map((decision) => (
              <button
                disabled={busy}
                key={decision}
                onClick={() =>
                  void action(async () => {
                    await decideModerationCase("/api", selected.report.id, {
                      decision,
                      version: selected.report.version,
                    });
                    setSelected(null);
                    onDecided();
                  })
                }
              >
                {t(decision === "hide" ? "hideContent" : "removeContent")}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
