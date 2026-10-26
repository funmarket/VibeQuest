-- Identity authenticates; Geo owns consent, current coordinates and session participation.
CREATE TABLE geo_preferences (
  user_id uuid PRIMARY KEY REFERENCES identity_users(id) ON DELETE CASCADE,
  decided boolean NOT NULL DEFAULT false,
  location_consent boolean NOT NULL DEFAULT false,
  social_sharing boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 0 CHECK (version>=0),
  CHECK (location_consent OR NOT social_sharing)
);
CREATE TABLE geo_positions (
  user_id uuid PRIMARY KEY REFERENCES geo_preferences(user_id) ON DELETE CASCADE,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy double precision NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
  observed_at timestamptz NOT NULL,
  accepted_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CHECK (expires_at>accepted_at)
);
CREATE INDEX geo_positions_expiry_idx ON geo_positions(expires_at);
-- Participation has no coordinate history and never stores raw session tokens.
CREATE TABLE geo_sessions (
  session_key text PRIMARY KEY CHECK (session_key ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL REFERENCES geo_preferences(user_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX geo_sessions_user_idx ON geo_sessions(user_id);
