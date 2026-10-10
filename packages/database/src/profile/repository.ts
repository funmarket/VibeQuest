import type { Pool } from "pg";
import type { Profile } from "@vq/contracts";
import { ProfileError, isProfileComplete } from "@vq/profile";
import type { ProfileRepository } from "@vq/profile/ports";

const columns = `user_id AS "userId",name,bio,handle,favorite_vibe AS "favoriteVibe",version,(SELECT media_id FROM profile_photos WHERE user_id=profile_profiles.user_id) AS "photoMediaId"`;
function present(row: Omit<Profile, "completed">): Profile {
  return { ...row, completed: isProfileComplete(row) };
}
export function createProfileRepository(pool: Pool): ProfileRepository {
  return {
    async publicHandle(handle) {
      return (
        (
          await pool.query(
            "SELECT user_id AS id,handle,name,bio FROM profile_profiles WHERE handle=$1",
            [handle],
          )
        ).rows[0] ?? null
      );
    },
    async publicMany(ids) {
      const rows = (
        await pool.query(
          "SELECT user_id AS id,handle,name,bio FROM profile_profiles WHERE user_id=ANY($1::uuid[])",
          [ids],
        )
      ).rows;
      const profiles = new Map(rows.map((row) => [row.id, row]));
      return ids.map(
        (id) => profiles.get(id) ?? { id, handle: null, name: "", bio: "" },
      );
    },
    async photoRetirements() {
      return (
        await pool.query<{ userId: string; mediaId: string }>(
          'SELECT user_id AS "userId",media_id AS "mediaId" FROM profile_photo_retirements WHERE attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 20',
        )
      ).rows;
    },
    async finishPhotoRetirement(mediaId) {
      await pool.query(
        "DELETE FROM profile_photo_retirements WHERE media_id=$1",
        [mediaId],
      );
    },
    async retryPhotoRetirement(mediaId) {
      await pool.query(
        "UPDATE profile_photo_retirements SET attempts=attempts+1,next_attempt_at=now()+make_interval(secs=>LEAST(3600,60*power(2,LEAST(attempts,6)))::integer) WHERE media_id=$1",
        [mediaId],
      );
    },
    async attachPhoto(userId, mediaId, version) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const changed = await client.query(
          "UPDATE profile_profiles SET version=version+1,updated_at=now() WHERE user_id=$1 AND version=$2",
          [userId, version],
        );
        if (changed.rowCount !== 1) throw new ProfileError("STALE_PROFILE");
        const previous = await client.query<{ media_id: string }>(
          "SELECT media_id FROM profile_photos WHERE user_id=$1",
          [userId],
        );
        const oldId = previous.rows[0]?.media_id;
        if (oldId && oldId !== mediaId)
          await client.query(
            "INSERT INTO profile_photo_retirements(media_id,user_id) VALUES($1,$2) ON CONFLICT(media_id) DO NOTHING",
            [oldId, userId],
          );
        if (mediaId)
          await client.query(
            "DELETE FROM profile_photo_retirements WHERE media_id=$1 AND user_id=$2",
            [mediaId, userId],
          );
        if (mediaId)
          await client.query(
            "INSERT INTO profile_photos(user_id,media_id) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET media_id=EXCLUDED.media_id",
            [userId, mediaId],
          );
        else
          await client.query("DELETE FROM profile_photos WHERE user_id=$1", [
            userId,
          ]);
        const saved = await client.query<Omit<Profile, "completed">>(
          `SELECT ${columns} FROM profile_profiles WHERE user_id=$1`,
          [userId],
        );
        await client.query("COMMIT");
        return present(saved.rows[0]);
      } catch (error) {
        await client.query("ROLLBACK");
        if ((error as { code?: string }).code === "23503")
          throw new ProfileError("INVALID_PROFILE_MEDIA");
        throw error;
      } finally {
        client.release();
      }
    },
    async read(userId) {
      const result = await pool.query<Omit<Profile, "completed">>(
        `SELECT ${columns} FROM profile_profiles WHERE user_id=$1`,
        [userId],
      );
      return result.rows[0] ? present(result.rows[0]) : null;
    },
    async save(userId, input) {
      try {
        const values = [
          userId,
          input.name,
          input.bio,
          input.handle,
          input.favoriteVibe,
          input.version,
        ];
        const query =
          input.version === 0
            ? `INSERT INTO profile_profiles(user_id,name,bio,handle,favorite_vibe) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO NOTHING RETURNING ${columns}`
            : `UPDATE profile_profiles SET name=$2,bio=$3,handle=$4,favorite_vibe=$5,version=version+1,updated_at=now() WHERE user_id=$1 AND version=$6 RETURNING ${columns}`;
        const result = await pool.query<Omit<Profile, "completed">>(
          query,
          input.version === 0 ? values.slice(0, 5) : values,
        );
        if (!result.rows[0]) throw new ProfileError("STALE_PROFILE");
        return present(result.rows[0]);
      } catch (error) {
        if ((error as { code?: string }).code === "23505")
          throw new ProfileError("HANDLE_UNAVAILABLE");
        throw error;
      }
    },
    async handleAvailable(handle, userId) {
      return !(
        await pool.query(
          "SELECT user_id FROM profile_profiles WHERE handle=$1 AND user_id<>$2",
          [handle, userId],
        )
      ).rowCount;
    },
  };
}
