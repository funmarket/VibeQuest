ALTER TABLE media_cleanup_jobs ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX media_cleanup_jobs_due_idx ON media_cleanup_jobs(next_attempt_at) WHERE completed_at IS NULL;
