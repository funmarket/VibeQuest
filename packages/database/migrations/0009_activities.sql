CREATE TABLE activities_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 author text NOT NULL CHECK(length(btrim(author)) BETWEEN 1 AND 80),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 160),
 description text NOT NULL CHECK(length(description)<=2000),
 location text NOT NULL CHECK(length(btrim(location)) BETWEEN 1 AND 200),
 emoji text NOT NULL CHECK(emoji IN ('🎵','☕','🎨','🎸','🍵','🌅','🎭','🎻','🧘')),
 starts_at timestamptz,
 cancelled_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_feed_idx ON activities_entries(starts_at,created_at DESC,id) WHERE cancelled_at IS NULL;
CREATE INDEX activities_owner_idx ON activities_entries(owner_id);
CREATE TABLE activities_attachments (
 activity_id uuid NOT NULL REFERENCES activities_entries(id) ON DELETE CASCADE,
 media_id uuid NOT NULL REFERENCES media_objects(id) ON DELETE NO ACTION,
 position integer NOT NULL CHECK(position BETWEEN 0 AND 3),
 PRIMARY KEY(activity_id,media_id), UNIQUE(activity_id,position)
);
CREATE INDEX activities_attachments_media_idx ON activities_attachments(media_id);
CREATE TABLE activities_saves (
 activity_id uuid NOT NULL REFERENCES activities_entries(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(activity_id,user_id)
);
CREATE TABLE activities_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),activity_id uuid NOT NULL REFERENCES activities_entries(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 author text NOT NULL CHECK(length(btrim(author)) BETWEEN 1 AND 80),
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),text text NOT NULL CHECK(length(btrim(text)) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activities_reviews_entry_idx ON activities_reviews(activity_id,created_at DESC,id);
