-- PROPOSED TARGET DESIGN; disposable PostgreSQL16/PostGIS only, after 0001-0020.
-- Existing image rows retain image semantics. No external object metadata is fabricated.
ALTER TABLE media_objects
 ADD COLUMN kind text NOT NULL DEFAULT 'image' CHECK(kind IN ('image','video','audio')),
 ADD COLUMN validated_mime text,
 ADD COLUMN duration_ms bigint CHECK(duration_ms>0),
 ADD COLUMN codec text,
 ADD COLUMN processor_version text,
 ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
-- 0004's unnamed table CHECK is media_objects_check in the source schema.
-- Abort if live introspection does not establish that exact constraint before implementation.
ALTER TABLE media_objects DROP CONSTRAINT media_objects_check;
ALTER TABLE media_objects ADD CONSTRAINT media_objects_ready_kind_check CHECK(
 status<>'ready' OR
 (source_sha256 IS NOT NULL AND stored_bytes IS NOT NULL AND
  ((kind='image' AND width IS NOT NULL AND height IS NOT NULL) OR
   (kind='video' AND width IS NOT NULL AND height IS NOT NULL AND duration_ms IS NOT NULL AND validated_mime IS NOT NULL AND codec IS NOT NULL) OR
   (kind='audio' AND duration_ms IS NOT NULL AND validated_mime IS NOT NULL AND codec IS NOT NULL))));
-- Additive same-post comment integrity. Preflight must return zero orphan/cross-post rows.
ALTER TABLE content_comments ADD CONSTRAINT content_comments_id_post_unique UNIQUE(id,post_id);
ALTER TABLE content_comments ADD CONSTRAINT content_comments_same_post_parent_fk
 FOREIGN KEY(parent_id,post_id) REFERENCES content_comments(id,post_id) DEFERRABLE INITIALLY DEFERRED;
