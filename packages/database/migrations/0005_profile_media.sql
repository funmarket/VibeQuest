CREATE TABLE profile_photos (
  user_id uuid PRIMARY KEY REFERENCES profile_profiles(user_id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_objects(id) ON DELETE NO ACTION,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profile_photos_media_idx ON profile_photos(media_id);
CREATE TABLE media_cleanup_jobs (
  object_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0)
);
CREATE FUNCTION queue_media_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO media_cleanup_jobs(object_id,owner_id) VALUES(OLD.id,OLD.owner_id) ON CONFLICT(object_id) DO NOTHING;
  RETURN OLD;
END;
$$;
CREATE TRIGGER media_cleanup_on_delete BEFORE DELETE ON media_objects FOR EACH ROW EXECUTE FUNCTION queue_media_cleanup();
