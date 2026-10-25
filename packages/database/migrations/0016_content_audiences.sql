CREATE TABLE social_blocks (
 blocker_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 blocked_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(blocker_id,blocked_id), CHECK(blocker_id<>blocked_id)
);
CREATE INDEX social_blocks_reverse_idx ON social_blocks(blocked_id,blocker_id);
ALTER TABLE media_objects DROP CONSTRAINT media_objects_visibility_check;
ALTER TABLE media_objects ADD CONSTRAINT media_objects_visibility_check CHECK(visibility IN ('public','private','content'));
ALTER TABLE content_posts DROP CONSTRAINT content_posts_text_check;
ALTER TABLE content_posts ADD COLUMN media_id uuid REFERENCES media_objects(id) ON DELETE NO ACTION;
ALTER TABLE content_posts ADD CONSTRAINT content_posts_body_check CHECK(content_js_length(text)<=280 AND (length(btrim(text))>0 OR media_id IS NOT NULL));
CREATE INDEX content_posts_media_idx ON content_posts(media_id) WHERE media_id IS NOT NULL;
CREATE TABLE content_media_retirements (
 media_id uuid PRIMARY KEY,user_id uuid NOT NULL,attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION content_retire_attachment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.media_id IS NOT NULL AND (TG_OP='DELETE' OR OLD.media_id IS DISTINCT FROM NEW.media_id) THEN
  INSERT INTO content_media_retirements(media_id,user_id) VALUES(OLD.media_id,OLD.author_id)
  ON CONFLICT(media_id) DO UPDATE SET attempts=0,next_attempt_at=now();
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER content_attachment_retirement AFTER DELETE OR UPDATE OF media_id ON content_posts FOR EACH ROW EXECUTE FUNCTION content_retire_attachment();
CREATE TABLE content_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 parent_id uuid REFERENCES content_comments(id) ON DELETE CASCADE,
 text text CHECK(content_js_length(text) BETWEEN 1 AND 1000 AND length(btrim(text))>0),
 deleted_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((text IS NULL)=(deleted_at IS NOT NULL))
);
CREATE INDEX content_comments_post_idx ON content_comments(post_id,created_at,id);
CREATE INDEX content_comments_parent_idx ON content_comments(parent_id);
CREATE TABLE content_reactions (
 post_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(post_id,user_id)
);
