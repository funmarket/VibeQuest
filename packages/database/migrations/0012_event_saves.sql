CREATE TABLE events_saves (
 event_id uuid NOT NULL REFERENCES events_entries(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event_id,user_id)
);
CREATE INDEX events_saves_user_idx ON events_saves(user_id,created_at DESC);
