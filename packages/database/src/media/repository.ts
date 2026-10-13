import type { Pool } from "pg";
import type { MediaRecord, MediaRepository } from "@vq/media/ports";
import { MediaError } from "@vq/media";
const columns = `id,owner_id AS "ownerId",visibility,status,width,height,expires_at AS "expiresAt"`;
function present(
  row: Omit<MediaRecord, "expiresAt"> & { expiresAt: Date },
): MediaRecord {
  return { ...row, expiresAt: row.expiresAt.toISOString() };
}
export function createMediaRepository(pool: Pool): MediaRepository {
  return {
    async create(ownerId, visibility) {
      const result = await pool.query(
        `INSERT INTO media_objects(owner_id,visibility) VALUES($1,$2) RETURNING ${columns}`,
        [ownerId, visibility],
      );
      return present(result.rows[0]);
    },
    async read(id) {
      const result = await pool.query(
        `SELECT ${columns} FROM media_objects WHERE id=$1`,
        [id],
      );
      return result.rows[0] ? present(result.rows[0]) : null;
    },
    async claim(id, ownerId) {
      const result = await pool.query(
        "UPDATE media_objects SET status='processing',updated_at=now() WHERE id=$1 AND owner_id=$2 AND status='pending' AND expires_at>now()",
        [id, ownerId],
      );
      return result.rowCount === 1;
    },
    async ready(id, output) {
      const result = await pool.query(
        `UPDATE media_objects SET status='ready',width=$2,height=$3,source_sha256=$4,stored_bytes=$5,updated_at=now() WHERE id=$1 AND status='processing' RETURNING ${columns}`,
        [
          id,
          output.width,
          output.height,
          output.digest,
          output.image.byteLength + output.thumbnail.byteLength,
        ],
      );
      if (!result.rows[0]) throw new MediaError("UPLOAD_NOT_AVAILABLE");
      return present(result.rows[0]);
    },
    async fail(id) {
      const result = await pool.query(
        `WITH failed AS (
          UPDATE media_objects SET status='failed',updated_at=now() WHERE id=$1 AND status='processing' RETURNING id,owner_id
        ) INSERT INTO media_cleanup_jobs(object_id,owner_id) SELECT id,owner_id FROM failed ON CONFLICT(object_id) DO NOTHING RETURNING object_id`,
        [id],
      );
      return result.rowCount === 1;
    },
    async markDeleted(id, ownerId) {
      try {
        const result = await pool.query(
          "DELETE FROM media_objects WHERE id=$1 AND owner_id=$2 AND status<>'processing'",
          [id, ownerId],
        );
        if (result.rowCount === 1) return true;
        return (
          (
            await pool.query(
              "SELECT object_id FROM media_cleanup_jobs WHERE object_id=$1 AND owner_id=$2",
              [id, ownerId],
            )
          ).rowCount === 1
        );
      } catch (error) {
        if ((error as { code?: string }).code === "23503")
          throw new MediaError("MEDIA_ATTACHED");
        throw error;
      }
    },
    async cleanupJobs() {
      const result = await pool.query<{ object_id: string }>(
        "SELECT object_id FROM media_cleanup_jobs WHERE completed_at IS NULL AND attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 20",
      );
      return result.rows.map((row) => row.object_id);
    },
    async expireUploads() {
      await pool.query(`DELETE FROM media_objects WHERE id IN (
        SELECT id FROM media_objects WHERE status IN ('pending','failed') AND expires_at<=now()
        ORDER BY expires_at LIMIT 20 FOR UPDATE SKIP LOCKED
      )`);
    },
    async retryCleanup(id) {
      await pool.query(
        "UPDATE media_cleanup_jobs SET attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,LEAST(attempts,6)))::integer) WHERE object_id=$1 AND completed_at IS NULL",
        [id],
      );
    },
    async completeCleanup(id) {
      await pool.query(
        "UPDATE media_cleanup_jobs SET completed_at=now(),attempts=attempts+1 WHERE object_id=$1",
        [id],
      );
    },
  };
}
