import type { Pool, PoolClient } from "pg";
import type { GeoRepository, GeoActor } from "@vq/geo/ports";
import { GeoError, validateReading, presenceLifetime } from "@vq/geo";
import type { GeoState } from "@vq/contracts";

export function createGeoRepository(pool: Pool): GeoRepository {
  async function locked<T>(
    userId: string,
    work: (client: PoolClient) => Promise<T>,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO geo_preferences(user_id) VALUES($1) ON CONFLICT DO NOTHING",
        [userId],
      );
      await client.query(
        "SELECT user_id FROM geo_preferences WHERE user_id=$1 FOR UPDATE",
        [userId],
      );
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async function prune(c: PoolClient, userId: string) {
    await c.query(
      "DELETE FROM geo_sessions WHERE user_id=$1 AND expires_at<=clock_timestamp()",
      [userId],
    );
    await c.query(
      "DELETE FROM geo_positions WHERE user_id=$1 AND (expires_at<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM geo_sessions WHERE user_id=$1 AND expires_at>clock_timestamp()))",
      [userId],
    );
  }
  async function read(c: PoolClient, actor: GeoActor): Promise<GeoState> {
    const prefs = (
      await c.query(
        'SELECT version,decided,location_consent AS "locationConsent",social_sharing AS "socialSharing" FROM geo_preferences WHERE user_id=$1',
        [actor.userId],
      )
    ).rows[0];
    const position = (
      await c.query(
        'SELECT latitude,longitude,accuracy,observed_at AS "observedAt",accepted_at AS "acceptedAt",expires_at AS "expiresAt" FROM geo_positions WHERE user_id=$1 AND expires_at>clock_timestamp() AND EXISTS(SELECT 1 FROM geo_sessions WHERE user_id=$1 AND session_key=$2 AND expires_at>clock_timestamp())',
        [actor.userId, actor.sessionKey],
      )
    ).rows[0];
    return {
      ...prefs,
      presence:
        prefs.locationConsent && position
          ? {
              ...position,
              observedAt: position.observedAt.toISOString(),
              acceptedAt: position.acceptedAt.toISOString(),
              expiresAt: position.expiresAt.toISOString(),
            }
          : null,
    };
  }
  async function clear(c: PoolClient, userId: string) {
    await c.query("DELETE FROM geo_positions WHERE user_id=$1", [userId]);
    await c.query("DELETE FROM geo_sessions WHERE user_id=$1", [userId]);
  }
  return {
    read: (actor) => locked(actor.userId, (c) => read(c, actor)),
    consent: (actor, input) =>
      locked(actor.userId, async (c) => {
        const result = await c.query(
          "UPDATE geo_preferences SET decided=true,location_consent=$2,social_sharing=$3,version=version+1 WHERE user_id=$1 AND version=$4 RETURNING version",
          [
            actor.userId,
            input.locationConsent,
            input.socialSharing,
            input.version,
          ],
        );
        if (!result.rowCount) throw new GeoError("GEO_CONFLICT");
        if (!input.locationConsent) await clear(c, actor.userId);
        await prune(c, actor.userId);
        return read(c, actor);
      }),
    observe: (actor, input) =>
      locked(actor.userId, async (c) => {
        const prefs = await read(c, actor);
        if (prefs.version !== input.version) throw new GeoError("GEO_CONFLICT");
        if (!prefs.locationConsent) throw new GeoError("GEO_CONSENT_REQUIRED");
        const now = (await c.query("SELECT clock_timestamp() AS at")).rows[0]
          .at as Date;
        const reading = {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          observedAt: input.observedAt,
        };
        validateReading(reading, now.getTime());
        const until = new Date(now.getTime() + presenceLifetime);
        const result = await c.query(
          "INSERT INTO geo_positions(user_id,latitude,longitude,accuracy,observed_at,accepted_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id) DO UPDATE SET latitude=$2,longitude=$3,accuracy=$4,observed_at=$5,accepted_at=CASE WHEN geo_positions.observed_at<$5 THEN $6 ELSE geo_positions.accepted_at END,expires_at=CASE WHEN geo_positions.observed_at<$5 THEN $7 ELSE geo_positions.expires_at END WHERE geo_positions.observed_at<$5 OR (geo_positions.observed_at=$5 AND geo_positions.latitude=$2 AND geo_positions.longitude=$3 AND geo_positions.accuracy=$4) RETURNING expires_at",
          [
            actor.userId,
            input.latitude,
            input.longitude,
            input.accuracy,
            input.observedAt,
            now,
            until,
          ],
        );
        if (!result.rowCount) throw new GeoError("GEO_CONFLICT");
        await c.query(
          "INSERT INTO geo_sessions(session_key,user_id,expires_at) VALUES($1,$2,$3) ON CONFLICT(session_key) DO UPDATE SET expires_at=$3",
          [
            actor.sessionKey,
            actor.userId,
            new Date(
              Math.min(
                result.rows[0].expires_at.getTime(),
                Date.parse(actor.sessionExpiresAt),
              ),
            ),
          ],
        );
        await prune(c, actor.userId);
        return read(c, actor);
      }),
    unavailable: (actor) =>
      locked(actor.userId, async (c) => {
        await clear(c, actor.userId);
        await c.query(
          "UPDATE geo_preferences SET version=version+1 WHERE user_id=$1",
          [actor.userId],
        );
        return read(c, actor);
      }),
    async logout(sessionKey) {
      const row = (
        await pool.query(
          "SELECT user_id FROM geo_sessions WHERE session_key=$1",
          [sessionKey],
        )
      ).rows[0];
      if (!row) return;
      await locked(row.user_id, async (c) => {
        await c.query("DELETE FROM geo_sessions WHERE session_key=$1", [
          sessionKey,
        ]);
        await prune(c, row.user_id);
      });
    },
    async cleanup() {
      // Bound each pass; serialize with observations/revocation for the same actor.
      const rows = (
        await pool.query(
          "SELECT user_id FROM geo_preferences WHERE user_id IN(SELECT user_id FROM geo_positions WHERE expires_at<=clock_timestamp() UNION SELECT user_id FROM geo_sessions WHERE expires_at<=clock_timestamp()) LIMIT 1000",
        )
      ).rows;
      for (const row of rows)
        await locked(row.user_id, (c) => prune(c, row.user_id));
    },
  };
}
