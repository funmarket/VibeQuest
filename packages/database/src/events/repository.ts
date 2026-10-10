import type { Pool, PoolClient } from "pg";
import type { OfficialEvent } from "@vq/contracts";
import type { EventsRepository } from "@vq/events/ports";
import { EventError } from "@vq/events";
const projection = `e.id,e.owner_id AS "ownerId",e.business_id AS "businessId",e.host_name AS "hostName",e.title,e.description,e.location,e.tag,e.starts_at AS "startsAt",e.version,e.created_at AS "createdAt",
 CASE WHEN e.cancelled_at IS NOT NULL THEN 'cancelled' WHEN e.starts_at>now() THEN 'upcoming' ELSE 'live' END AS status,
 ARRAY(SELECT media_id FROM events_attachments WHERE event_id=e.id ORDER BY position) AS "mediaIds",
 EXISTS(SELECT 1 FROM events_rsvps WHERE event_id=e.id AND user_id=$2) AS going,
 EXISTS(SELECT 1 FROM events_saves WHERE event_id=e.id AND user_id=$2) AS saved,
 (SELECT count(*)::integer FROM events_rsvps WHERE event_id=e.id) AS "rsvpCount",
 (SELECT count(*)::integer FROM events_reviews WHERE event_id=e.id) AS "reviewCount",COALESCE((SELECT avg(rating)::float FROM events_reviews WHERE event_id=e.id),0) AS rating`;
function present(
  row: Omit<OfficialEvent, "createdAt" | "startsAt"> & {
    createdAt: Date;
    startsAt: Date | null;
  },
): OfficialEvent {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    startsAt: row.startsAt?.toISOString() ?? null,
  };
}
export function createEventsRepository(pool: Pool): EventsRepository {
  const readWith = async (
    client: Pool | PoolClient,
    id: string,
    actorId?: string,
  ) => {
    const row = (
      await client.query(
        `SELECT ${projection} FROM events_entries e WHERE e.id=$1`,
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
        throw new EventError("INVALID_EVENT_MEDIA");
      throw error;
    } finally {
      client.release();
    }
  }
  async function attach(client: PoolClient, id: string, ids: string[]) {
    for (let i = 0; i < ids.length; i++)
      await client.query(
        "INSERT INTO events_attachments(event_id,media_id,position) VALUES($1,$2,$3)",
        [id, ids[i], i],
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
        "SELECT owner_id,business_id,version,cancelled_at,starts_at,starts_at<=clock_timestamp() AS started FROM events_entries WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!row) throw new EventError("EVENT_NOT_FOUND");
    if (row.owner_id !== actorId) throw new EventError("EVENT_FORBIDDEN");
    if (row.version !== version || row.cancelled_at)
      throw new EventError("EVENT_CONFLICT");
    return row;
  }
  return {
    read,
    async list(tab, offset, actorId) {
      const rows = (
        await pool.query(
          `SELECT ${projection} FROM events_entries e WHERE e.cancelled_at IS NULL AND CASE WHEN $1='upcoming' THEN e.starts_at>now() ELSE e.starts_at IS NULL OR e.starts_at<=now() END ORDER BY e.created_at DESC,e.id DESC LIMIT 21 OFFSET $3`,
          [tab, actorId ?? null, offset],
        )
      ).rows;
      return {
        events: rows.slice(0, 20).map(present),
        nextOffset: rows.length > 20 ? offset + 20 : null,
      };
    },
    create(actorId, hostName, input) {
      return transaction(async (client) => {
        const id = (
          await client.query(
            "INSERT INTO events_entries(owner_id,business_id,host_name,title,description,location,tag,starts_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
            [
              actorId,
              input.businessId,
              hostName,
              input.title,
              input.description,
              input.location,
              input.tag,
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
        const row = await mutable(client, actorId, id, input.version);
        if (row.business_id !== input.businessId)
          throw new EventError("EVENT_FORBIDDEN");
        if (
          (!row.starts_at || row.started) &&
          (row.starts_at?.toISOString() ?? null) !== input.startsAt
        )
          throw new EventError("INVALID_EVENT_SCHEDULE");
        await client.query(
          "UPDATE events_entries SET title=$3,description=$4,location=$5,tag=$6,starts_at=$7,version=version+1,updated_at=now() WHERE id=$1 AND owner_id=$2",
          [
            id,
            actorId,
            input.title,
            input.description,
            input.location,
            input.tag,
            input.startsAt,
          ],
        );
        await client.query(
          "INSERT INTO events_media_retirements(media_id,user_id) SELECT media_id,$2 FROM events_attachments WHERE event_id=$1 AND NOT(media_id=ANY($3::uuid[])) ON CONFLICT(media_id) DO NOTHING",
          [id, actorId, input.mediaIds],
        );
        await client.query(
          "DELETE FROM events_media_retirements WHERE user_id=$1 AND media_id=ANY($2::uuid[])",
          [actorId, input.mediaIds],
        );
        await client.query("DELETE FROM events_attachments WHERE event_id=$1", [
          id,
        ]);
        await attach(client, id, input.mediaIds);
        return (await readWith(client, id, actorId))!;
      });
    },
    cancel(actorId, id, version) {
      return transaction(async (client) => {
        await mutable(client, actorId, id, version);
        await client.query(
          "UPDATE events_entries SET cancelled_at=now(),version=version+1,updated_at=now() WHERE id=$1 AND owner_id=$2",
          [id, actorId],
        );
        return (await readWith(client, id, actorId))!;
      });
    },
    async rsvp(actorId, id, going) {
      await transaction(async (client) => {
        const row = (
          await client.query(
            "SELECT cancelled_at FROM events_entries WHERE id=$1 FOR SHARE",
            [id],
          )
        ).rows[0];
        if (!row) throw new EventError("EVENT_NOT_FOUND");
        if (going && row.cancelled_at) throw new EventError("EVENT_CONFLICT");
        if (going)
          await client.query(
            "INSERT INTO events_rsvps(event_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [id, actorId],
          );
        else
          await client.query(
            "DELETE FROM events_rsvps WHERE event_id=$1 AND user_id=$2",
            [id, actorId],
          );
      });
    },
    async save(actorId, id, saved) {
      await transaction(async (client) => {
        const row = (
          await client.query(
            "SELECT cancelled_at FROM events_entries WHERE id=$1 FOR SHARE",
            [id],
          )
        ).rows[0];
        if (!row) throw new EventError("EVENT_NOT_FOUND");
        if (saved && row.cancelled_at) throw new EventError("EVENT_CONFLICT");
        if (saved)
          await client.query(
            "INSERT INTO events_saves(event_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [id, actorId],
          );
        else
          await client.query(
            "DELETE FROM events_saves WHERE event_id=$1 AND user_id=$2",
            [id, actorId],
          );
      });
    },
    async review(actorId, author, id, input) {
      await transaction(async (client) => {
        const row = (
          await client.query(
            "SELECT cancelled_at FROM events_entries WHERE id=$1 FOR SHARE",
            [id],
          )
        ).rows[0];
        if (!row) throw new EventError("EVENT_NOT_FOUND");
        if (row.cancelled_at) throw new EventError("EVENT_CONFLICT");
        await client.query(
          "INSERT INTO events_reviews(event_id,user_id,author,rating,text) VALUES($1,$2,$3,$4,$5)",
          [id, actorId, author, input.rating, input.text],
        );
      });
    },
    async reviews(id, offset) {
      if (!(await read(id))) throw new EventError("EVENT_NOT_FOUND");
      const rows = (
        await pool.query(
          'SELECT id,author,rating,text,created_at AS "createdAt" FROM events_reviews WHERE event_id=$1 ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $2',
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
    async retirements() {
      return (
        await pool.query<{ userId: string; mediaId: string }>(
          'SELECT user_id AS "userId",media_id AS "mediaId" FROM events_media_retirements WHERE attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 20',
        )
      ).rows;
    },
    async finishRetirement(id) {
      await pool.query(
        "DELETE FROM events_media_retirements WHERE media_id=$1",
        [id],
      );
    },
    async retryRetirement(id) {
      await pool.query(
        "UPDATE events_media_retirements SET attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,LEAST(attempts,6)))::integer) WHERE media_id=$1",
        [id],
      );
    },
  };
}
