CREATE TABLE activities_media_retirements (
 media_id uuid PRIMARY KEY,user_id uuid NOT NULL,attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 next_attempt_at timestamptz NOT NULL DEFAULT now()
);
