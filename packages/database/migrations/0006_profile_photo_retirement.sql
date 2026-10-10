CREATE TABLE profile_photo_retirements (
  media_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0)
);
CREATE INDEX profile_photo_retirements_due_idx ON profile_photo_retirements(next_attempt_at);
