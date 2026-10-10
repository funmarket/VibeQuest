import type { Pool, PoolClient } from "pg";
import type { Activity } from "@vq/contracts";
import type { ActivitiesRepository } from "@vq/activities/ports";
import { ActivityError } from "@vq/activities";
const projection = `a.id,a.owner_id AS "ownerId",a.author,a.title,a.description,a.location,a.emoji,a.starts_at AS "startsAt",a.version,a.created_at AS "createdAt",
 CASE WHEN a.cancelled_at IS NOT NULL THEN 'cancelled' WHEN a.starts_at>now() THEN 'upcoming' ELSE 'live' END AS status,
 ARRAY(SELECT media_id FROM activities_attachments WHERE activity_id=a.id ORDER BY position) AS "mediaIds",
 EXISTS(SELECT 1 FROM activities_saves WHERE activity_id=a.id AND user_id=$2) AS saved,
 (SELECT count(*)::integer FROM activities_reviews WHERE activity_id=a.id) AS "reviewCount",
 COALESCE((SELECT avg(rating)::float FROM activities_reviews WHERE activity_id=a.id),0) AS rating`;
function present(
  row: Omit<Activity, "createdAt" | "startsAt"> & {
    createdAt: Date;
    startsAt: Date | null;
  },
): Activity {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    startsAt: row.startsAt?.toISOString() ?? null,
  };
}
export function createActivitiesRepository(pool: Pool): ActivitiesRepository {
  const readWith = async (
    client: Pool | PoolClient,
    id: string,
    actorId?: string,
  ) => {
    const row = (
      await client.query(
        `SELECT ${projection} FROM activities_entries a WHERE a.id=$1`,
        [id, actorId ?? null],
      )
    ).rows[0];
    return row ? present(row) : null;
  };
  const read = (id: string, actorId?: string) => readWith(pool, id, actorId);
  async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as { code?: string }).code === "23503")
        throw new ActivityError("INVALID_ACTIVITY_MEDIA");
      throw error;
    } finally {
      client.release();
    }
  }
  async function attach(client: PoolClient, id: string, ids: string[]) {
    for (let position = 0; position < ids.length; position++)
      await client.query(
        "INSERT INTO activities_attachments(activity_id,media_id,position) VALUES($1,$2,$3)",
        [id, ids[position], position],
      );
  }
  async function mutable(
    client: PoolClient,
    actorId: string,
    id: string,
    version: number,
  ) {
    const row = (
      await client.query(
        "SELECT owner_id,version,cancelled_at,starts_at FROM activities_entries WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!row) throw new ActivityError("ACTIVITY_NOT_FOUND");
    if (row.owner_id !== actorId) throw new ActivityError("ACTIVITY_FORBIDDEN");
    if (row.version !== version || row.cancelled_at)
      throw new ActivityError("ACTIVITY_CONFLICT");
    return row;
  }
  return {
    async retirements() {
      return (
        await pool.query<{ userId: string; mediaId: string }>(
          'SELECT user_id AS "userId",media_id AS "mediaId" FROM activities_media_retirements WHERE attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 20',
        )
      ).rows;
    },
    async finishRetirement(id) {
      await pool.query(
        "DELETE FROM activities_media_retirements WHERE media_id=$1",
        [id],
      );
    },
    async retryRetirement(id) {
      await pool.query(
        "UPDATE activities_media_retirements SET attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,LEAST(attempts,6)))::integer) WHERE media_id=$1",
        [id],
      );
    },
    read,
    async list(tab, offset, actorId) {
      const rows = (
        await pool.query(
          `SELECT ${projection} FROM activities_entries a WHERE a.cancelled_at IS NULL AND CASE WHEN $1='upcoming' THEN a.starts_at>now() ELSE a.starts_at IS NULL OR a.starts_at<=now() END ORDER BY a.created_at DESC,a.id DESC LIMIT 21 OFFSET $3`,
          [tab, actorId ?? null, offset],
        )
      ).rows;
      return {
        activities: rows.slice(0, 20).map(present),
        nextOffset: rows.length > 20 ? offset + 20 : null,
      };
    },
    create(actorId, author, input) {
      return transaction(async (client) => {
        const id = (
          await client.query(
            "INSERT INTO activities_entries(owner_id,author,title,description,location,emoji,starts_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
            [
              actorId,
              author,
              input.title,
              input.description,
              input.location,
              input.emoji,
              input.startsAt,
            ],
          )
        ).rows[0].id;
        await attach(client, id, input.mediaIds);
        return (await readWith(client, id, actorId))!;
      });
    },
    edit(actorId, id, input) {
      return transaction(async (client) => {
        const current = await mutable(client, actorId, id, input.version);
        // A start crossing the clock while an edit waits must not move a live gathering back into Upcoming.
        if (
          current.starts_at &&
          current.starts_at.getTime() <= Date.now() &&
          current.starts_at.toISOString() !== input.startsAt
        )
          throw new ActivityError("INVALID_SCHEDULE");
        await client.query(
          "UPDATE activities_entries SET title=$3,description=$4,location=$5,emoji=$6,starts_at=$7,version=version+1,updated_at=now() WHERE id=$1 AND owner_id=$2",
          [
            id,
            actorId,
            input.title,
            input.description,
            input.location,
            input.emoji,
            input.startsAt,
          ],
        );
        await client.query(
          "INSERT INTO activities_media_retirements(media_id,user_id) SELECT media_id,$2 FROM activities_attachments WHERE activity_id=$1 AND NOT(media_id=ANY($3::uuid[])) ON CONFLICT(media_id) DO NOTHING",
          [id, actorId, input.mediaIds],
        );
        await client.query(
          "DELETE FROM activities_media_retirements WHERE user_id=$1 AND media_id=ANY($2::uuid[])",
          [actorId, input.mediaIds],
        );
        await client.query(
          "DELETE FROM activities_attachments WHERE activity_id=$1",
          [id],
        );
        await attach(client, id, input.mediaIds);
        return (await readWith(client, id, actorId))!;
      });
    },
    cancel(actorId, id, version) {
      return transaction(async (client) => {
        await mutable(client, actorId, id, version);
        await client.query(
          "UPDATE activities_entries SET cancelled_at=now(),version=version+1,updated_at=now() WHERE id=$1 AND owner_id=$2",
          [id, actorId],
        );
        return (await readWith(client, id, actorId))!;
      });
    },
    async save(actorId, id, saved) {
      await transaction(async (client) => {
        const row = (
          await client.query(
            "SELECT cancelled_at FROM activities_entries WHERE id=$1 FOR SHARE",
            [id],
          )
        ).rows[0];
        if (!row) throw new ActivityError("ACTIVITY_NOT_FOUND");
        if (saved && row.cancelled_at)
          throw new ActivityError("ACTIVITY_CONFLICT");
        if (saved)
          await client.query(
            "INSERT INTO activities_saves(activity_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [id, actorId],
          );
        else
          await client.query(
            "DELETE FROM activities_saves WHERE activity_id=$1 AND user_id=$2",
            [id, actorId],
          );
      });
    },
    async review(actorId, author, id, input) {
      await transaction(async (client) => {
        const row = (
          await client.query(
            "SELECT starts_at,cancelled_at FROM activities_entries WHERE id=$1 FOR SHARE",
            [id],
          )
        ).rows[0];
        if (!row) throw new ActivityError("ACTIVITY_NOT_FOUND");
        if (!row.starts_at) throw new ActivityError("REVIEWS_NOT_SUPPORTED");
        if (row.cancelled_at) throw new ActivityError("ACTIVITY_CONFLICT");
        await client.query(
          "INSERT INTO activities_reviews(activity_id,user_id,author,rating,text) VALUES($1,$2,$3,$4,$5)",
          [id, actorId, author, input.rating, input.text],
        );
      });
    },
    async reviews(id, offset) {
      if (!(await read(id))) throw new ActivityError("ACTIVITY_NOT_FOUND");
      const rows = (
        await pool.query(
          'SELECT id,author,rating,text,created_at AS "createdAt" FROM activities_reviews WHERE activity_id=$1 ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $2',
          [id, offset],
        )
      ).rows;
      return {
        reviews: rows
          .slice(0, 20)
          .map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
        nextOffset: rows.length > 20 ? offset + 20 : null,
      };
    },
  };
}
