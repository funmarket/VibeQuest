import type { Pool } from "pg";
import type { SocialRepository } from "@vq/social/ports";
import { SocialError } from "@vq/social";
export function createSocialRepository(pool: Pool): SocialRepository {
  return {
    async feedAuthors(actor) {
      return [
        actor,
        ...(
          await pool.query<{ id: string }>(
            "SELECT followed_id AS id FROM social_follows WHERE follower_id=$1",
            [actor],
          )
        ).rows.map((row) => row.id),
      ];
    },
    async blockedUsers(actor) {
      return (
        await pool.query<{ id: string }>(
          "SELECT blocked_id AS id FROM social_blocks WHERE blocker_id=$1 ORDER BY created_at DESC,blocked_id",
          [actor],
        )
      ).rows.map((row) => row.id);
    },
    async withRelationship(actor, target, work) {
      if (!actor) return work({ following: false, blocked: false });
      const client = await pool.connect();
      const key = [actor, target].sort().join(":");
      try {
        await client.query(
          "SELECT pg_advisory_lock(hashtextextended($1,861013))",
          [key],
        );
        const facts = (
          await client.query<{ following: boolean; blocked: boolean }>(
            "SELECT EXISTS(SELECT 1 FROM social_follows WHERE follower_id=$1 AND followed_id=$2) AS following, EXISTS(SELECT 1 FROM social_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)) AS blocked",
            [actor, target],
          )
        ).rows[0];
        return await work(facts);
      } finally {
        try {
          await client.query(
            "SELECT pg_advisory_unlock(hashtextextended($1,861013))",
            [key],
          );
        } finally {
          client.release();
        }
      }
    },
    async setBlock(actor, target, blocked) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,861013))",
          [[actor, target].sort().join(":")],
        );
        if (blocked) {
          await client.query(
            "INSERT INTO social_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [actor, target],
          );
          await client.query(
            "DELETE FROM social_follows WHERE (follower_id=$1 AND followed_id=$2) OR (follower_id=$2 AND followed_id=$1)",
            [actor, target],
          );
        } else
          await client.query(
            "DELETE FROM social_blocks WHERE blocker_id=$1 AND blocked_id=$2",
            [actor, target],
          );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async setFollow(actor, target, following) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,861013))",
          [[actor, target].sort().join(":")],
        );
        if (
          following &&
          (
            await client.query(
              "SELECT 1 FROM social_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)",
              [actor, target],
            )
          ).rowCount
        )
          throw new SocialError("SOCIAL_BLOCKED");
        if (following)
          await client.query(
            "INSERT INTO social_follows(follower_id,followed_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [actor, target],
          );
        else
          await client.query(
            "DELETE FROM social_follows WHERE follower_id=$1 AND followed_id=$2",
            [actor, target],
          );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        if ((error as { code?: string }).code === "23503")
          throw new SocialError("SOCIAL_NOT_FOUND");
        throw error;
      } finally {
        client.release();
      }
    },
    async scan(actor, side, after, limit) {
      const rows = (
        await pool.query(
          side === "following"
            ? `SELECT followed_id AS id,to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at FROM social_follows WHERE follower_id=$1 AND ($2::timestamptz IS NULL OR (created_at,followed_id)<($2::timestamptz,$3::uuid)) ORDER BY created_at DESC,followed_id DESC LIMIT $4`
            : `SELECT follower_id AS id,to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at FROM social_follows WHERE followed_id=$1 AND ($2::timestamptz IS NULL OR (created_at,follower_id)<($2::timestamptz,$3::uuid)) ORDER BY created_at DESC,follower_id DESC LIMIT $4`,
          [actor, after?.at ?? null, after?.id ?? null, limit],
        )
      ).rows;
      return rows.map((row) => ({
        id: row.id,
        at: row.at,
      }));
    },
    async states(actor, ids) {
      const rows = (
        await pool.query(
          'SELECT id, EXISTS(SELECT 1 FROM social_follows WHERE follower_id=$1 AND followed_id=id) AS following, EXISTS(SELECT 1 FROM social_follows WHERE follower_id=id AND followed_id=$1) AS "followedBy" FROM unnest($2::uuid[]) WITH ORDINALITY AS targets(id,position) ORDER BY position',
          [actor ?? null, ids],
        )
      ).rows;
      return rows.map((row) => ({
        following: row.following,
        followedBy: row.followedBy,
        mutual: row.following && row.followedBy,
      }));
    },
  };
}
