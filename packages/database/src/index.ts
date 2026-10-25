import pg from "pg";
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
  return {
    pool,
    identity: createIdentityRepository(pool),
    profiles: createProfileRepository(pool),
    media: createMediaRepository(pool),
    businesses: createBusinessRepository(pool),
    activities: createActivitiesRepository(pool),
    events: createEventsRepository(pool),
    social: createSocialRepository(pool),
    content: createContentRepository(pool),
    repository: createPlacesRepository(pool),
    async readiness() {
      await pool.query(
        "SELECT id FROM places WHERE publication_status = 'published' LIMIT 0",
      );
      await pool.query(`SELECT u.id,a.password_hash,s.token_hash,p.version,m.status,ph.media_id,j.object_id,j.next_attempt_at,pr.next_attempt_at,limits.resets_at
        FROM identity_users u CROSS JOIN identity_password_accounts a CROSS JOIN identity_sessions s
        CROSS JOIN profile_profiles p CROSS JOIN media_objects m CROSS JOIN profile_photos ph
        CROSS JOIN media_cleanup_jobs j CROSS JOIN profile_photo_retirements pr CROSS JOIN identity_attempt_limits limits
        CROSS JOIN identity_privileges ip CROSS JOIN business_organizations bo CROSS JOIN business_memberships bm CROSS JOIN business_reviews br
        CROSS JOIN activities_entries ae CROSS JOIN activities_attachments aa CROSS JOIN activities_saves av CROSS JOIN activities_reviews ar CROSS JOIN activities_media_retirements amr
        CROSS JOIN events_entries ee CROSS JOIN events_attachments ea CROSS JOIN events_rsvps er CROSS JOIN events_saves es CROSS JOIN events_reviews ev CROSS JOIN events_media_retirements emr
        CROSS JOIN social_follows sf CROSS JOIN content_posts cp LIMIT 0`);
    },
    close: () => pool.end(),
  };
}
