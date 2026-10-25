import type { Pool } from "pg";
import type { ContentRepository } from "@vq/content/ports";
import type {
  ModerationCase,
  ReportReceipt,
  ModerationEvidence,
  GossipReportInput,
} from "@vq/contracts";
import { ContentError } from "@vq/content";

const time = (name: string) =>
  `to_char(${name} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const columns = `id,reporter_id AS "reporterId",post_id AS "postId",target_type AS "targetType",target_id AS "targetId",status,version,${time("submitted_at")} AS "submittedAt",${time("pending_until")} AS "pendingUntil",${time("decided_at")} AS "decidedAt",decision,${time("evidence_expires_at")} AS "evidenceExpiresAt"`;
type ReportRow = ModerationCase & {
  reason: GossipReportInput["reason"] | null;
  details: string | null;
  evidence: ModerationEvidence | null;
};
function receipt(row: ModerationCase): ReportReceipt {
  return {
    id: row.id,
    status: row.status,
    version: row.version,
    submittedAt: row.submittedAt,
    pendingUntil: row.pendingUntil,
    decidedAt: row.decidedAt,
    decision: row.decision,
    evidenceExpiresAt: row.evidenceExpiresAt,
  };
}
export function createContentModerationRepository(
  pool: Pool,
): Pick<
  ContentRepository,
  "report" | "cases" | "evidence" | "decide" | "expireReports"
> {
  return {
    async report(postId, targetType, targetId, actor, version, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const post = (
          await client.query<ModerationEvidence["post"]>(
            `SELECT id,author_id AS "authorId",text,location_label AS "locationLabel",audience,emoji,version,${time("created_at")} AS "createdAt" FROM content_posts WHERE id=$1 AND deleted_at IS NULL AND hidden_at IS NULL FOR UPDATE`,
            [postId],
          )
        ).rows[0];
        if (!post) throw new ContentError("CONTENT_NOT_FOUND");
        if (post.version !== version)
          throw new ContentError("CONTENT_CONFLICT");
        const existing = (
          await client.query<ModerationCase & { open: boolean }>(
            `SELECT ${columns},pending_until>clock_timestamp() AS open FROM content_reports WHERE reporter_id=$1 AND target_type=$2 AND target_id=$3 ORDER BY submitted_at DESC,id DESC LIMIT 1`,
            [actor, targetType, targetId],
          )
        ).rows[0];
        if (existing) {
          if (existing.status !== "pending" || !existing.open)
            throw new ContentError("REPORT_CLOSED");
          await client.query("COMMIT");
          return receipt(existing);
        }
        let comment: ModerationEvidence["comment"] = null;
        if (targetType === "comment") {
          comment = (
            await client.query<NonNullable<ModerationEvidence["comment"]>>(
              `SELECT id,post_id AS "postId",author_id AS "authorId",parent_id AS "parentId",text,${time("created_at")} AS "createdAt" FROM content_comments WHERE id=$1 AND post_id=$2 AND deleted_at IS NULL AND hidden_at IS NULL`,
              [targetId, postId],
            )
          ).rows[0];
          if (!comment) throw new ContentError("CONTENT_NOT_FOUND");
        }
        const evidence: ModerationEvidence = { post, comment };
        const row = (
          await client.query<ModerationCase>(
            `WITH moment AS (SELECT clock_timestamp() AS at) INSERT INTO content_reports(reporter_id,post_id,target_type,target_id,reason,details,evidence,submitted_at,pending_until,evidence_expires_at) SELECT $1,$2,$3,$4,$5,$6,$7::jsonb,at,at+interval '30 days',at+interval '30 days' FROM moment RETURNING ${columns}`,
            [
              actor,
              postId,
              targetType,
              targetId,
              input.reason,
              input.details,
              JSON.stringify(evidence),
            ],
          )
        ).rows[0];
        await client.query("COMMIT");
        return receipt(row);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async cases(after) {
      const rows = (
        await pool.query<ModerationCase>(
          `SELECT ${columns} FROM content_reports WHERE evidence IS NOT NULL AND evidence_expires_at>clock_timestamp() AND ($1::timestamptz IS NULL OR (submitted_at,id)<($1::timestamptz,$2::uuid)) ORDER BY submitted_at DESC,id DESC LIMIT 21`,
          [after?.at ?? null, after?.id ?? null],
        )
      ).rows;
      const reports = rows.slice(0, 20),
        last = reports.at(-1);
      return {
        reports,
        nextCursor:
          rows.length > 20 && last
            ? { at: last.submittedAt, id: last.id }
            : null,
      };
    },
    async evidence(id) {
      const row = (
        await pool.query<ReportRow>(
          `SELECT ${columns},reason,details,evidence FROM content_reports WHERE id=$1 AND evidence IS NOT NULL AND evidence_expires_at>clock_timestamp()`,
          [id],
        )
      ).rows[0];
      if (!row || !row.reason || !row.evidence) return null;
      const { reason, details, evidence, ...report } = row;
      return { report, reason, details: details ?? "", evidence };
    },
    async decide(id, actor, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const row = (
          await client.query<ReportRow & { open: boolean }>(
            `SELECT ${columns},pending_until>clock_timestamp() AS open FROM content_reports WHERE id=$1 FOR UPDATE`,
            [id],
          )
        ).rows[0];
        if (!row) throw new ContentError("CONTENT_NOT_FOUND");
        if (row.status !== "pending" || row.version !== input.version)
          throw new ContentError("CONTENT_CONFLICT");
        if (!row.open) throw new ContentError("REPORT_EXPIRED");
        await client.query(
          "SELECT id FROM content_posts WHERE id=$1 FOR UPDATE",
          [row.postId],
        );
        if (row.targetType === "post") {
          if (input.decision === "remove")
            await client.query("DELETE FROM content_posts WHERE id=$1", [
              row.targetId,
            ]);
          else
            await client.query(
              "UPDATE content_posts SET hidden_at=coalesce(hidden_at,clock_timestamp()),version=version+1,updated_at=clock_timestamp() WHERE id=$1",
              [row.targetId],
            );
        } else {
          if (input.decision === "remove")
            await client.query(
              "UPDATE content_comments SET text=NULL,deleted_at=coalesce(deleted_at,clock_timestamp()) WHERE id=$1 AND post_id=$2",
              [row.targetId, row.postId],
            );
          else
            await client.query(
              "UPDATE content_comments SET hidden_at=coalesce(hidden_at,clock_timestamp()) WHERE id=$1 AND post_id=$2",
              [row.targetId, row.postId],
            );
          await client.query(
            "UPDATE content_posts SET version=version+1,updated_at=clock_timestamp() WHERE id=$1",
            [row.postId],
          );
        }
        const result = (
          await client.query<ModerationCase>(
            `WITH moment AS (SELECT clock_timestamp() AS at) UPDATE content_reports SET status='decided',decision=$2,moderator_id=$3,decided_at=moment.at,evidence_expires_at=moment.at+interval '30 days',version=version+1 FROM moment WHERE id=$1 AND pending_until>moment.at RETURNING ${columns}`,
            [id, input.decision, actor],
          )
        ).rows[0];
        if (!result) throw new ContentError("REPORT_EXPIRED");
        await client.query("COMMIT");
        return receipt(result);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async expireReports() {
      await pool.query(
        "UPDATE content_reports SET status=CASE WHEN status='pending' THEN 'expired' ELSE status END,version=version+CASE WHEN status='pending' THEN 1 ELSE 0 END,evidence=NULL,reason=NULL,details=NULL WHERE evidence_expires_at<=clock_timestamp() AND id IN (SELECT id FROM content_reports WHERE evidence_expires_at<=clock_timestamp() AND (status='pending' OR evidence IS NOT NULL OR reason IS NOT NULL OR details IS NOT NULL) ORDER BY evidence_expires_at,id LIMIT 1000)",
      );
    },
  };
}
