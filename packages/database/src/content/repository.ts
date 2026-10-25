import type { Pool } from "pg";
import type { GossipTextPost, GossipTextEdit } from "@vq/contracts";
import type { ContentRepository } from "@vq/content/ports";
import { ContentError, assertPostAuthor, assertPostRestore } from "@vq/content";

const timestamp = (column: string) =>
  `to_char(${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const columns = `id,author_id AS "authorId",text,location_label AS "locationLabel",audience,version,${timestamp("deleted_at")} AS "deletedAt",${timestamp("created_at")} AS "createdAt",${timestamp("updated_at")} AS "updatedAt"`;

export function createContentRepository(pool: Pool): ContentRepository {
  async function mutate(
    actorId: string,
    id: string,
    version: number,
    action: "edit" | "delete" | "restore",
    edit?: GossipTextEdit,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const row = (
        await client.query<GossipTextPost>(
          `SELECT ${columns} FROM content_posts WHERE id=$1 AND author_id=$2 FOR UPDATE`,
          [id, actorId],
        )
      ).rows[0];
      if (!row) throw new ContentError("CONTENT_NOT_FOUND");
      assertPostAuthor(actorId, row.authorId);
      if (row.version !== version) throw new ContentError("CONTENT_CONFLICT");
      if (action === "restore") {
        const clock = (
          await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")
        ).rows[0].now;
        assertPostRestore(row.deletedAt, clock.getTime());
      } else if (row.deletedAt !== null)
        throw new ContentError("CONTENT_NOT_FOUND");
      const result =
        action === "edit"
          ? await client.query<GossipTextPost>(
              `UPDATE content_posts SET text=$3,location_label=$4,version=version+1,updated_at=clock_timestamp() WHERE id=$1 AND author_id=$2 RETURNING ${columns}`,
              [id, actorId, edit!.text, edit!.locationLabel],
            )
          : await client.query<GossipTextPost>(
              `UPDATE content_posts SET deleted_at=${action === "delete" ? "clock_timestamp()" : "NULL"},version=version+1,updated_at=clock_timestamp() WHERE id=$1 AND author_id=$2 RETURNING ${columns}`,
              [id, actorId],
            );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    async createText(actorId, input) {
      return (
        await pool.query<GossipTextPost>(
          `INSERT INTO content_posts(author_id,text,location_label,audience) VALUES($1,$2,$3,$4) RETURNING ${columns}`,
          [actorId, input.text, input.locationLabel, input.audience],
        )
      ).rows[0];
    },
    async readOwn(actorId, id) {
      return (
        (
          await pool.query<GossipTextPost>(
            `SELECT ${columns} FROM content_posts WHERE id=$1 AND author_id=$2 AND deleted_at IS NULL`,
            [id, actorId],
          )
        ).rows[0] ?? null
      );
    },
    async listOwn(actorId, deleted, after) {
      const rows = (
        await pool.query<GossipTextPost>(
          `SELECT ${columns} FROM content_posts WHERE author_id=$1 AND (CASE WHEN $2 THEN deleted_at IS NOT NULL AND deleted_at>clock_timestamp()-interval '11 days' ELSE deleted_at IS NULL END) AND ($3::timestamptz IS NULL OR (created_at,id)<($3::timestamptz,$4::uuid)) ORDER BY created_at DESC,id DESC LIMIT 21`,
          [actorId, deleted, after?.at ?? null, after?.id ?? null],
        )
      ).rows;
      const posts = rows.slice(0, 20);
      const last = posts.at(-1);
      return {
        posts,
        nextCursor:
          rows.length > 20 && last ? { at: last.createdAt, id: last.id } : null,
      };
    },
    editText: (actorId, id, input) =>
      mutate(actorId, id, input.version, "edit", input),
    deleteOwn: (actorId, id, version) => mutate(actorId, id, version, "delete"),
    restoreOwn: (actorId, id, version) =>
      mutate(actorId, id, version, "restore"),
    async purgeExpired() {
      await pool.query(
        "DELETE FROM content_posts WHERE deleted_at<=clock_timestamp()-interval '11 days' AND id IN (SELECT id FROM content_posts WHERE deleted_at<=clock_timestamp()-interval '11 days' ORDER BY deleted_at,id LIMIT 1000)",
      );
    },
  };
}
