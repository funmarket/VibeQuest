CREATE TABLE profile_profiles (
  user_id uuid PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK(length(name)<=80),
  bio text NOT NULL CHECK(length(bio)<=1000),
  handle text UNIQUE CHECK(handle ~ '^[a-z0-9_]{3,30}$'),
  favorite_vibe text NOT NULL CHECK(length(favorite_vibe) BETWEEN 1 AND 32),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
