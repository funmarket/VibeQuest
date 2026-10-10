CREATE TABLE events_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 business_id uuid NOT NULL REFERENCES business_organizations(id) ON DELETE NO ACTION,
 host_name text NOT NULL CHECK(length(btrim(host_name)) BETWEEN 2 AND 120),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 160),description text NOT NULL CHECK(length(description)<=2000),
 location text NOT NULL CHECK(length(btrim(location)) BETWEEN 1 AND 200),tag text NOT NULL CHECK(tag IN ('music','art','cafe','theatre')),
 starts_at timestamptz,cancelled_at timestamptz,version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_feed_idx ON events_entries(starts_at,created_at DESC,id) WHERE cancelled_at IS NULL;
CREATE INDEX events_owner_idx ON events_entries(owner_id);
CREATE INDEX events_business_idx ON events_entries(business_id);
CREATE TABLE events_attachments(event_id uuid NOT NULL REFERENCES events_entries(id) ON DELETE CASCADE,media_id uuid NOT NULL REFERENCES media_objects(id) ON DELETE NO ACTION,position integer NOT NULL CHECK(position BETWEEN 0 AND 3),PRIMARY KEY(event_id,media_id),UNIQUE(event_id,position));
CREATE INDEX events_attachments_media_idx ON events_attachments(media_id);
CREATE TABLE events_rsvps(event_id uuid NOT NULL REFERENCES events_entries(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(event_id,user_id));
CREATE TABLE events_reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL REFERENCES events_entries(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,author text NOT NULL CHECK(length(btrim(author)) BETWEEN 1 AND 80),rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),text text NOT NULL CHECK(length(btrim(text)) BETWEEN 1 AND 1000),created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX events_reviews_entry_idx ON events_reviews(event_id,created_at DESC,id);
CREATE TABLE events_media_retirements(media_id uuid PRIMARY KEY,user_id uuid NOT NULL,attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),next_attempt_at timestamptz NOT NULL DEFAULT now());
