CREATE TABLE social_follows (
 follower_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 followed_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(follower_id,followed_id),
 CHECK(follower_id<>followed_id)
);
CREATE INDEX social_following_idx ON social_follows(follower_id,created_at DESC,followed_id DESC);
CREATE INDEX social_followers_idx ON social_follows(followed_id,created_at DESC,follower_id DESC);
