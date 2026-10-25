ALTER TABLE content_posts ADD COLUMN hidden_at timestamptz;
ALTER TABLE content_comments ADD COLUMN hidden_at timestamptz;
CREATE TABLE content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id uuid REFERENCES identity_users(id) ON DELETE SET NULL,
 post_id uuid NOT NULL,
 target_type text NOT NULL CHECK(target_type IN ('post','comment')),
 target_id uuid NOT NULL,
 reason text CHECK(reason IN ('spam_scam','harassment_bullying','hate_discrimination','threats_violence','sexual_inappropriate','privacy_violation','impersonation','other')),
 details text CHECK(content_js_length(details)<=1000),
 evidence jsonb,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','decided','expired')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 pending_until timestamptz NOT NULL DEFAULT clock_timestamp()+interval '30 days',
 decided_at timestamptz,
 moderator_id uuid REFERENCES identity_users(id) ON DELETE SET NULL,
 decision text CHECK(decision IN ('hide','remove')),
 evidence_expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '30 days',
 CHECK((status='decided')=(decided_at IS NOT NULL AND decision IS NOT NULL))
);
CREATE UNIQUE INDEX content_report_active_idx ON content_reports(reporter_id,target_type,target_id) WHERE status='pending';
CREATE INDEX content_report_history_idx ON content_reports(reporter_id,target_type,target_id,submitted_at DESC);
CREATE INDEX content_report_expiry_idx ON content_reports(evidence_expires_at) WHERE evidence IS NOT NULL OR status='pending';
