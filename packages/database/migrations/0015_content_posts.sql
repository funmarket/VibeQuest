-- Social Content owns author records. No audience reader or Media link is
-- introduced until the remaining D02 access/transition decisions are settled.
CREATE FUNCTION content_js_length(value text) RETURNS bigint
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
 SELECT coalesce(sum(CASE WHEN ascii(character)>65535 THEN 2 ELSE 1 END),0)::bigint
 FROM regexp_split_to_table(value,'') AS character
$$;
CREATE TABLE content_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 text text NOT NULL CHECK(content_js_length(text) BETWEEN 1 AND 280 AND length(btrim(text))>0),
 location_label text NOT NULL CHECK(content_js_length(location_label)<=40),
 audience text NOT NULL DEFAULT 'PUBLIC' CHECK(audience IN ('PUBLIC','FOLLOWERS_ONLY')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 deleted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_posts_author_idx ON content_posts(author_id,created_at DESC,id DESC);
CREATE INDEX content_posts_expiry_idx ON content_posts(deleted_at,id) WHERE deleted_at IS NOT NULL;
