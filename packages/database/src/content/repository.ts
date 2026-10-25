import type { Pool, PoolClient } from "pg";
import type { GossipTextPost, GossipTextEdit } from "@vq/contracts";
import type { ContentRepository, CommentRecord } from "@vq/content/ports";
import { ContentError, assertPostAuthor, assertPostRestore } from "@vq/content";
import { createContentModerationRepository } from "./moderation";

const timestamp = (column: string) =>
  `to_char(${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const columns = `id,author_id AS "authorId",text,location_label AS "locationLabel",audience,emoji,media_id AS "mediaId",version,${timestamp("deleted_at")} AS "deletedAt",${timestamp("created_at")} AS "createdAt",${timestamp("updated_at")} AS "updatedAt"`;
const commentColumns = `id,post_id AS "postId",author_id AS "authorId",parent_id AS "parentId",CASE WHEN hidden_at IS NULL THEN text ELSE NULL END AS text,${timestamp("created_at")} AS "createdAt"`;

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
          `SELECT ${columns} FROM content_posts WHERE id=$1 AND author_id=$2 AND hidden_at IS NULL FOR UPDATE`,
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
              `UPDATE content_posts SET text=$3,location_label=$4,audience=$5,media_id=$6,emoji=$7,version=version+1,updated_at=clock_timestamp() WHERE id=$1 AND author_id=$2 RETURNING ${columns}`,
              [
                id,
                actorId,
                edit!.text,
                edit!.locationLabel,
                edit!.audience ?? row.audience,
                edit!.mediaId === undefined ? row.mediaId : edit!.mediaId,
                edit!.emoji ?? row.emoji,
              ],
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
  async function interaction<T>(
    id: string,
    version: number,
    work: (client: PoolClient, author: string) => Promise<T>,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const post = (
        await client.query<{ version: number; author_id: string }>(
          "SELECT version,author_id FROM content_posts WHERE id=$1 AND deleted_at IS NULL AND hidden_at IS NULL FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!post) throw new ContentError("CONTENT_NOT_FOUND");
      if (post.version !== version) throw new ContentError("CONTENT_CONFLICT");
      const result = await work(client, post.author_id);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return {
    ...createContentModerationRepository(pool),
    async read(id) {
      return (
        (
          await pool.query<GossipTextPost>(
            `SELECT ${columns} FROM content_posts WHERE id=$1 AND deleted_at IS NULL AND hidden_at IS NULL`,
            [id],
          )
        ).rows[0] ?? null
      );
    },
    async scan(after, limit, authors) {
      return (
        await pool.query<GossipTextPost>(
          `SELECT ${columns} FROM content_posts WHERE deleted_at IS NULL AND hidden_at IS NULL AND (($4::uuid[] IS NULL AND audience='PUBLIC') OR author_id=ANY($4::uuid[])) AND ($1::timestamptz IS NULL OR (created_at,id)<($1::timestamptz,$2::uuid)) ORDER BY created_at DESC,id DESC LIMIT $3`,
          [after?.at ?? null, after?.id ?? null, limit, authors],
        )
      ).rows;
    },
    async stats(id, actor) {
      const row = (
        await pool.query<{
          likeCount: number;
          commentCount: number;
          liked: boolean;
        }>(
          `SELECT (SELECT count(*)::integer FROM content_reactions WHERE post_id=$1) AS "likeCount",(SELECT count(*)::integer FROM content_comments WHERE post_id=$1 AND deleted_at IS NULL AND hidden_at IS NULL) AS "commentCount",EXISTS(SELECT 1 FROM content_reactions WHERE post_id=$1 AND user_id=$2) AS liked`,
          [id, actor ?? null],
        )
      ).rows[0];
      return row;
    },
    async comment(postId, actor, version, input) {
      return interaction(postId, version, async (client) => {
        if (
          input.parentId &&
          !(
            await client.query(
              "SELECT id FROM content_comments WHERE id=$1 AND post_id=$2 AND deleted_at IS NULL AND hidden_at IS NULL",
              [input.parentId, postId],
            )
          ).rowCount
        )
          throw new ContentError("CONTENT_NOT_FOUND");
        return (
          await client.query<CommentRecord>(
            `INSERT INTO content_comments(post_id,author_id,parent_id,text) VALUES($1,$2,$3,$4) RETURNING ${commentColumns}`,
            [postId, actor, input.parentId, input.text],
          )
        ).rows[0];
      });
    },
    async comments(postId, after) {
      return (
        await pool.query<CommentRecord>(
          `WITH RECURSIVE visible(id) AS (SELECT id FROM content_comments WHERE post_id=$1 AND deleted_at IS NULL AND hidden_at IS NULL UNION SELECT c.parent_id FROM content_comments c JOIN visible v ON c.id=v.id WHERE c.parent_id IS NOT NULL) SELECT ${commentColumns} FROM content_comments WHERE post_id=$1 AND id IN(SELECT id FROM visible) AND ($2::timestamptz IS NULL OR (created_at,id)>($2::timestamptz,$3::uuid)) ORDER BY created_at,id LIMIT 21`,
          [postId, after?.at ?? null, after?.id ?? null],
        )
      ).rows;
    },
    async deleteComment(postId, id, actor, version) {
      await interaction(postId, version, async (client, author) => {
        const result = await client.query(
          "UPDATE content_comments SET text=NULL,deleted_at=coalesce(deleted_at,clock_timestamp()) WHERE id=$1 AND post_id=$2 AND (author_id=$3 OR $3=$4) RETURNING id",
          [id, postId, actor, author],
        );
        if (!result.rowCount) throw new ContentError("CONTENT_NOT_FOUND");
      });
    },
    async react(postId, actor, version, liked) {
      await interaction(postId, version, async (client) => {
        if (liked)
          await client.query(
            "INSERT INTO content_reactions(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [postId, actor],
          );
        else
          await client.query(
            "DELETE FROM content_reactions WHERE post_id=$1 AND user_id=$2",
            [postId, actor],
          );
      });
    },
    async retirements() {
      return (
        await pool.query<{ mediaId: string; userId: string }>(
          'SELECT media_id AS "mediaId",user_id AS "userId" FROM content_media_retirements WHERE attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 20',
        )
      ).rows;
    },
    async finishRetirement(id) {
      await pool.query(
        "DELETE FROM content_media_retirements WHERE media_id=$1",
        [id],
      );
    },
    async retryRetirement(id) {
      await pool.query(
        "UPDATE content_media_retirements SET attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,LEAST(attempts,6)))::integer) WHERE media_id=$1",
        [id],
      );
    },
    async createText(actorId, input) {
      return (
        await pool.query<GossipTextPost>(
          `INSERT INTO content_posts(author_id,text,location_label,audience,media_id,emoji) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${columns}`,
          [
            actorId,
            input.text,
            input.locationLabel,
            input.audience,
            input.mediaId,
            input.emoji,
          ],
        )
      ).rows[0];
    },
    async readOwn(actorId, id) {
      return (
        (
          await pool.query<GossipTextPost>(
            `SELECT ${columns} FROM content_posts WHERE id=$1 AND author_id=$2 AND deleted_at IS NULL AND hidden_at IS NULL`,
            [id, actorId],
          )
        ).rows[0] ?? null
      );
    },
    async listOwn(actorId, deleted, after) {
      const rows = (
        await pool.query<GossipTextPost>(
          `SELECT ${columns} FROM content_posts WHERE author_id=$1 AND hidden_at IS NULL AND (CASE WHEN $2 THEN deleted_at IS NOT NULL AND deleted_at>clock_timestamp()-interval '11 days' ELSE deleted_at IS NULL END) AND ($3::timestamptz IS NULL OR (created_at,id)<($3::timestamptz,$4::uuid)) ORDER BY created_at DESC,id DESC LIMIT 21`,
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
