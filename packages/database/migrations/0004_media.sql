CREATE TABLE media_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  visibility text NOT NULL CHECK(visibility IN ('public','private')),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','ready','failed','deleted')),
  width integer CHECK(width>0), height integer CHECK(height>0),
  source_sha256 text CHECK(source_sha256 ~ '^[0-9a-f]{64}$'),
  stored_bytes bigint CHECK(stored_bytes>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(status<>'ready' OR (width IS NOT NULL AND height IS NOT NULL AND source_sha256 IS NOT NULL AND stored_bytes IS NOT NULL))
);
CREATE INDEX media_objects_owner_idx ON media_objects(owner_id,created_at DESC);
CREATE INDEX media_objects_cleanup_idx ON media_objects(status,updated_at);
