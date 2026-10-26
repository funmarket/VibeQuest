import pg from "pg";
import { createGeoRepository } from "./geo/repository";
import { createPlacesRepository } from "./places/repository";
import { createIdentityRepository } from "./identity/repository";
import { createProfileRepository } from "./profile/repository";
import { createMediaRepository } from "./media/repository";
import { createBusinessRepository } from "./business/repository";
import { createActivitiesRepository } from "./activities/repository";
import { createEventsRepository } from "./events/repository";
import { createSocialRepository } from "./social/repository";
import { createContentRepository } from "./content/repository";

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
  });
  // Relationship locks span an authorized Content operation. Keep their waiters
  // out of the data pool so concurrent block/follow writes cannot starve it.
  const graphPool = new pg.Pool({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
  });
  return {
    pool,
    identity: createIdentityRepository(pool, graphPool),
    geo: createGeoRepository(pool),
    profiles: createProfileRepository(pool),
    media: createMediaRepository(pool),
    businesses: createBusinessRepository(pool),
    activities: createActivitiesRepository(pool),
    events: createEventsRepository(pool),
    social: createSocialRepository(graphPool),
    content: createContentRepository(pool),
    repository: createPlacesRepository(pool),
    async readiness() {
      await pool.query(
        "SELECT geo_preferences.user_id FROM geo_preferences CROSS JOIN geo_positions CROSS JOIN geo_sessions LIMIT 0",
      );
      await pool.query(
        "SELECT id FROM places WHERE publication_status = 'published' LIMIT 0",
      );
      await pool.query(`SELECT u.id,a.password_hash,s.token_hash,p.version,m.status,ph.media_id,j.object_id,j.next_attempt_at,pr.next_attempt_at,limits.resets_at,cp.media_id,cp.emoji,cp.hidden_at,cc.hidden_at,crep.evidence_expires_at
        FROM identity_users u CROSS JOIN identity_password_accounts a CROSS JOIN identity_sessions s
        CROSS JOIN profile_profiles p CROSS JOIN media_objects m CROSS JOIN profile_photos ph
        CROSS JOIN media_cleanup_jobs j CROSS JOIN profile_photo_retirements pr CROSS JOIN identity_attempt_limits limits
        CROSS JOIN identity_privileges ip CROSS JOIN business_organizations bo CROSS JOIN business_memberships bm CROSS JOIN business_reviews br
        CROSS JOIN activities_entries ae CROSS JOIN activities_attachments aa CROSS JOIN activities_saves av CROSS JOIN activities_reviews ar CROSS JOIN activities_media_retirements amr
        CROSS JOIN events_entries ee CROSS JOIN events_attachments ea CROSS JOIN events_rsvps er CROSS JOIN events_saves es CROSS JOIN events_reviews ev CROSS JOIN events_media_retirements emr
        CROSS JOIN social_follows sf CROSS JOIN social_blocks sb CROSS JOIN content_posts cp CROSS JOIN content_comments cc CROSS JOIN content_reactions cr CROSS JOIN content_reports crep CROSS JOIN content_media_retirements cmr LIMIT 0`);
    },
    close: async () => {
      await Promise.all([pool.end(), graphPool.end()]);
    },
  };
}
