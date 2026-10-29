-- PROPOSED TARGET DESIGN. Scratch candidate only. Apply ONLY to disposable PostgreSQL 16/PostGIS after immutable 0001-0020.
-- No policy or activation approval is conveyed. No records, grants or provider configuration are seeded.
CREATE TABLE identity_provider_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK(provider IN ('telegram','google')),
  subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 1024),
  verified_at timestamptz NOT NULL,
  UNIQUE(provider,subject),
  CHECK(provider IS NULL OR octet_length(provider)<=65536)
);

CREATE TABLE identity_auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid,
  purpose text NOT NULL CHECK(purpose IN ('login-exchange','link','recovery','oauth-state','verification')),
  secret_hash text NOT NULL UNIQUE CHECK(secret_hash ~ '^[0-9a-f]{64}$'),
  provider text,
  state_digest text CHECK(state_digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK(expires_at>created_at),
  CHECK(consumed_at IS NULL OR consumed_at>=created_at),
  CHECK(purpose IS NULL OR octet_length(purpose)<=65536),
  CHECK(secret_hash IS NULL OR octet_length(secret_hash)<=65536),
  CHECK(provider IS NULL OR octet_length(provider)<=65536),
  CHECK(state_digest IS NULL OR octet_length(state_digest)<=65536)
);

CREATE TABLE identity_verification_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  scope text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','verified','rejected','expired')),
  expires_at timestamptz,
  decided_at timestamptz,
  decided_by uuid,
  method text NOT NULL,
  policy_version text NOT NULL,
  CHECK((status IN ('verified','rejected'))=(decided_at IS NOT NULL)),
  CHECK(expires_at IS NULL OR expires_at>created_at),
  CHECK(scope IS NULL OR octet_length(scope)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(method IS NULL OR octet_length(method)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE identity_verification_media (
  case_id uuid NOT NULL,
  media_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(case_id,media_id)
);

CREATE TABLE identity_privilege_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  target_id uuid,
  actor_id uuid,
  privilege text NOT NULL,
  action text NOT NULL CHECK(action IN ('grant','revoke')),
  occurred_at timestamptz NOT NULL,
  request_id uuid NOT NULL,
  UNIQUE(request_id,privilege,action),
  CHECK(privilege IS NULL OR octet_length(privilege)<=65536),
  CHECK(action IS NULL OR octet_length(action)<=65536)
);

CREATE TABLE identity_erasure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('requested','authorized','running','blocked','completed')),
  requested_at timestamptz NOT NULL,
  approved_at timestamptz,
  completed_at timestamptz,
  policy_version text NOT NULL,
  CHECK((status='completed')=(completed_at IS NOT NULL)),
  CHECK(status NOT IN ('authorized','running','completed') OR approved_at IS NOT NULL),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE profile_preferences (
  user_id uuid NOT NULL,
  discovery_filter text NOT NULL,
  text_scale text NOT NULL,
  ordinary_dm_audience text CHECK(ordinary_dm_audience IN ('MUTUAL_FOLLOWS','EVERYONE','NOBODY')),
  PRIMARY KEY(user_id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(discovery_filter IS NULL OR octet_length(discovery_filter)<=65536),
  CHECK(text_scale IS NULL OR octet_length(text_scale)<=65536),
  CHECK(ordinary_dm_audience IS NULL OR octet_length(ordinary_dm_audience)<=65536)
);

CREATE TABLE profile_publication_grants (
  user_id uuid NOT NULL,
  field text NOT NULL,
  audience text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,field),
  CHECK(field IS NULL OR octet_length(field)<=65536),
  CHECK(audience IS NULL OR octet_length(audience)<=65536)
);

CREATE TABLE profile_passport_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  source_owner text NOT NULL,
  source_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  public_grant boolean NOT NULL,
  UNIQUE(user_id,kind,source_owner,source_id),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(source_owner IS NULL OR octet_length(source_owner)<=65536),
  CHECK(source_id IS NULL OR octet_length(source_id)<=65536)
);

CREATE TABLE profile_matching_declarations (
  user_id uuid NOT NULL,
  relationship_goals text[] NOT NULL,
  core_values text[] NOT NULL,
  deal_breakers jsonb NOT NULL,
  energy text,
  routine text,
  planning text,
  social_style text,
  consent_version text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id),
  CHECK(relationship_goals IS NULL OR octet_length(relationship_goals::text)<=65536),
  CHECK(core_values IS NULL OR octet_length(core_values::text)<=65536),
  CHECK(energy IS NULL OR octet_length(energy)<=65536),
  CHECK(routine IS NULL OR octet_length(routine)<=65536),
  CHECK(planning IS NULL OR octet_length(planning)<=65536),
  CHECK(social_style IS NULL OR octet_length(social_style)<=65536),
  CHECK(consent_version IS NULL OR octet_length(consent_version)<=65536)
);

CREATE TABLE geo_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  provider text NOT NULL,
  external_key text NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  boundary geometry(MultiPolygon,4326) NOT NULL,
  source_version text NOT NULL,
  UNIQUE(provider,external_key),
  CHECK(NOT ST_IsEmpty(boundary) AND ST_IsValid(boundary)),
  CHECK(ST_XMin(Box3D(boundary))>=-180 AND ST_XMax(Box3D(boundary))<=180 AND ST_YMin(Box3D(boundary))>=-90 AND ST_YMax(Box3D(boundary))<=90),
  CHECK(provider IS NULL OR octet_length(provider)<=65536),
  CHECK(external_key IS NULL OR octet_length(external_key)<=65536),
  CHECK(name IS NULL OR octet_length(name)<=65536),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(source_version IS NULL OR octet_length(source_version)<=65536)
);

CREATE TABLE geo_proof_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  purpose text NOT NULL,
  subject_owner text NOT NULL,
  subject_id uuid NOT NULL,
  accepted_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  policy_version text NOT NULL,
  verdict text NOT NULL,
  consent_version integer NOT NULL CHECK(consent_version>=0),
  CHECK(expires_at>accepted_at),
  CHECK(purpose IS NULL OR octet_length(purpose)<=65536),
  CHECK(subject_owner IS NULL OR octet_length(subject_owner)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(verdict IS NULL OR octet_length(verdict)<=65536)
);

CREATE TABLE content_post_areas (
  post_id uuid NOT NULL,
  area_id uuid NOT NULL,
  attribution_method text NOT NULL,
  policy_version text NOT NULL,
  attributed_at timestamptz NOT NULL,
  author_consent_version text NOT NULL,
  PRIMARY KEY(post_id),
  CHECK(attribution_method IS NULL OR octet_length(attribution_method)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(author_consent_version IS NULL OR octet_length(author_consent_version)<=65536)
);

CREATE TABLE media_variants (
  object_id uuid NOT NULL,
  variant text NOT NULL,
  processor_version text NOT NULL,
  mime text NOT NULL,
  object_key text NOT NULL UNIQUE,
  digest text NOT NULL CHECK(digest ~ '^[0-9a-f]{64}$'),
  bytes bigint NOT NULL CHECK(bytes>0),
  width integer CHECK(width>0),
  height integer CHECK(height>0),
  duration_ms bigint CHECK(duration_ms>0),
  codec text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(object_id,variant,processor_version),
  CHECK((width IS NULL)=(height IS NULL)),
  CHECK(variant IS NULL OR octet_length(variant)<=65536),
  CHECK(processor_version IS NULL OR octet_length(processor_version)<=65536),
  CHECK(mime IS NULL OR octet_length(mime)<=65536),
  CHECK(object_key IS NULL OR octet_length(object_key)<=65536),
  CHECK(digest IS NULL OR octet_length(digest)<=65536),
  CHECK(codec IS NULL OR octet_length(codec)<=65536)
);

CREATE TABLE media_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  object_id uuid NOT NULL,
  processor_version text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','processing','succeeded','failed','exhausted')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL,
  lease_owner text,
  lease_until timestamptz,
  error_code text,
  UNIQUE(object_id,processor_version),
  CHECK((lease_owner IS NULL)=(lease_until IS NULL)),
  CHECK(status<>'processing' OR lease_until IS NOT NULL),
  CHECK(processor_version IS NULL OR octet_length(processor_version)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(lease_owner IS NULL OR octet_length(lease_owner)<=65536),
  CHECK(error_code IS NULL OR octet_length(error_code)<=65536)
);

CREATE TABLE media_capture_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  owner_id uuid NOT NULL,
  purpose text NOT NULL,
  subject_owner text NOT NULL,
  subject_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  consumed_at timestamptz,
  consumed_by_owner text,
  consumed_by_id uuid,
  nonce_hash text NOT NULL UNIQUE CHECK(nonce_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  status text NOT NULL CHECK(status IN ('issued','completed','consumed','expired','failed')),
  attestation_level text NOT NULL,
  device_claim jsonb,
  UNIQUE(owner_id,operation_id),
  CHECK(expires_at>issued_at),
  CHECK((consumed_at IS NULL)=(consumed_by_owner IS NULL) AND (consumed_at IS NULL)=(consumed_by_id IS NULL)),
  CHECK((status='consumed')=(consumed_at IS NOT NULL)),
  CHECK(status NOT IN ('completed','consumed') OR completed_at IS NOT NULL),
  CHECK(completed_at IS NULL OR completed_at>=issued_at),
  CHECK(consumed_at IS NULL OR consumed_at>=completed_at),
  CHECK(purpose IS NULL OR octet_length(purpose)<=65536),
  CHECK(subject_owner IS NULL OR octet_length(subject_owner)<=65536),
  CHECK(consumed_by_owner IS NULL OR octet_length(consumed_by_owner)<=65536),
  CHECK(nonce_hash IS NULL OR octet_length(nonce_hash)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(attestation_level IS NULL OR octet_length(attestation_level)<=65536)
);

CREATE TABLE media_capture_frames (
  receipt_id uuid NOT NULL,
  media_id uuid NOT NULL,
  camera_role text NOT NULL,
  sequence integer NOT NULL CHECK(sequence>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(receipt_id,sequence),
  UNIQUE(receipt_id,media_id),
  UNIQUE(receipt_id,camera_role),
  CHECK(camera_role IS NULL OR octet_length(camera_role)<=65536)
);

CREATE TABLE operation_receipts (
  actor_id uuid NOT NULL,
  owner text NOT NULL,
  operation text NOT NULL,
  key text NOT NULL,
  request_digest text NOT NULL CHECK(request_digest ~ '^[0-9a-f]{64}$'),
  result_ref text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id,owner,operation,key),
  CHECK(expires_at>created_at),
  CHECK(owner IS NULL OR octet_length(owner)<=65536),
  CHECK(operation IS NULL OR octet_length(operation)<=65536),
  CHECK(key IS NULL OR octet_length(key)<=65536),
  CHECK(request_digest IS NULL OR octet_length(request_digest)<=65536),
  CHECK(result_ref IS NULL OR octet_length(result_ref)<=65536)
);

CREATE TABLE domain_outbox (
  event_id uuid NOT NULL,
  owner text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version integer NOT NULL CHECK(aggregate_version>0),
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload_version integer NOT NULL CHECK(payload_version>0),
  payload jsonb NOT NULL,
  dispatched_at timestamptz,
  next_attempt_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  PRIMARY KEY(event_id),
  CHECK(owner IS NULL OR octet_length(owner)<=65536),
  CHECK(aggregate_type IS NULL OR octet_length(aggregate_type)<=65536),
  CHECK(event_type IS NULL OR octet_length(event_type)<=65536)
);

CREATE TABLE domain_inbox (
  consumer text NOT NULL,
  event_id uuid NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  outcome_ref text NOT NULL,
  PRIMARY KEY(consumer,event_id),
  CHECK(consumer IS NULL OR octet_length(consumer)<=65536),
  CHECK(outcome_ref IS NULL OR octet_length(outcome_ref)<=65536)
);

CREATE TABLE job_leases (
  owner text NOT NULL,
  job_key text NOT NULL,
  due_at timestamptz NOT NULL,
  lease_holder text,
  lease_until timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  status text NOT NULL CHECK(status IN ('pending','running','succeeded','exhausted','cancelled')),
  error_code text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner,job_key),
  CHECK((lease_holder IS NULL)=(lease_until IS NULL)),
  CHECK(status<>'running' OR lease_until IS NOT NULL),
  CHECK(owner IS NULL OR octet_length(owner)<=65536),
  CHECK(job_key IS NULL OR octet_length(job_key)<=65536),
  CHECK(lease_holder IS NULL OR octet_length(lease_holder)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(error_code IS NULL OR octet_length(error_code)<=65536)
);

CREATE TABLE operator_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  actor_id uuid,
  target_owner text NOT NULL,
  target_id text NOT NULL,
  action text NOT NULL,
  request_id uuid NOT NULL,
  outcome text NOT NULL,
  occurred_at timestamptz NOT NULL,
  detail_digest text NOT NULL CHECK(detail_digest ~ '^[0-9a-f]{64}$'),
  CHECK(target_owner IS NULL OR octet_length(target_owner)<=65536),
  CHECK(target_id IS NULL OR octet_length(target_id)<=65536),
  CHECK(action IS NULL OR octet_length(action)<=65536),
  CHECK(outcome IS NULL OR octet_length(outcome)<=65536),
  CHECK(detail_digest IS NULL OR octet_length(detail_digest)<=65536)
);

CREATE TABLE identity_erasure_steps (
  request_id uuid NOT NULL,
  owner text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','running','acknowledged','blocked')),
  acknowledged_at timestamptz,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(request_id,owner),
  CHECK((status='acknowledged')=(acknowledged_at IS NOT NULL)),
  CHECK(owner IS NULL OR octet_length(owner)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(failure_code IS NULL OR octet_length(failure_code)<=65536)
);

CREATE TABLE matching_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  prompt text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','accepted','ignored','cancelled','expired')),
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  relationship_id uuid,
  CHECK(sender_id<>recipient_id),
  CHECK(expires_at>created_at),
  CHECK((status='pending')=(decided_at IS NULL)),
  CHECK((status='accepted')=(relationship_id IS NOT NULL)),
  CHECK(prompt IS NULL OR octet_length(prompt)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE matching_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_low uuid NOT NULL,
  user_high uuid NOT NULL,
  origin text NOT NULL CHECK(origin IN ('MANUAL','ROMANCE','SOCIAL')),
  status text NOT NULL CHECK(status IN ('active','disconnected')),
  activated_at timestamptz NOT NULL,
  disconnected_at timestamptz,
  source_invitation_id uuid,
  selection_id uuid,
  CHECK(user_low<user_high),
  CHECK((status='disconnected')=(disconnected_at IS NOT NULL)),
  CHECK((origin='MANUAL' AND source_invitation_id IS NOT NULL AND selection_id IS NULL) OR (origin IN ('ROMANCE','SOCIAL') AND source_invitation_id IS NULL AND selection_id IS NOT NULL)),
  UNIQUE(source_invitation_id),
  UNIQUE(selection_id),
  CHECK(origin IS NULL OR octet_length(origin)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE matching_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  program text NOT NULL CHECK(program IN ('ROMANCE','SOCIAL')),
  enabled boolean NOT NULL,
  consent_version text NOT NULL,
  enrolled_at timestamptz NOT NULL,
  withdrawn_at timestamptz,
  UNIQUE(user_id,program),
  CHECK(enabled=(withdrawn_at IS NULL)),
  CHECK(program IS NULL OR octet_length(program)<=65536),
  CHECK(consent_version IS NULL OR octet_length(consent_version)<=65536)
);

CREATE TABLE matching_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  program text NOT NULL CHECK(program IN ('ROMANCE','SOCIAL')),
  period_key text NOT NULL,
  policy_version text NOT NULL,
  status text NOT NULL CHECK(status IN ('planned','running','completed','failed')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  UNIQUE(program,period_key),
  CHECK(ends_at>starts_at),
  CHECK(program IS NULL OR octet_length(program)<=65536),
  CHECK(period_key IS NULL OR octet_length(period_key)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE matching_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  run_id uuid NOT NULL,
  user_low uuid NOT NULL,
  user_high uuid NOT NULL,
  evidence jsonb NOT NULL,
  eligible_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('eligible','active','passed','revoked')),
  CHECK(user_low<user_high),
  UNIQUE(run_id,user_low,user_high),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE matching_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  selection_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  facts jsonb NOT NULL,
  policy_version text NOT NULL,
  UNIQUE(selection_id,viewer_id),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE matching_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  relationship_id uuid,
  selection_id uuid,
  occurred_at timestamptz NOT NULL,
  policy_version text NOT NULL,
  CHECK(num_nonnulls(relationship_id,selection_id)=1),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE matching_behavior_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  source_owner text NOT NULL,
  source_event_id text NOT NULL,
  feature text NOT NULL,
  value jsonb NOT NULL,
  observed_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consent_version text NOT NULL,
  policy_version text NOT NULL,
  UNIQUE(source_owner,source_event_id,user_id,feature),
  CHECK(expires_at>observed_at),
  CHECK(source_owner IS NULL OR octet_length(source_owner)<=65536),
  CHECK(source_event_id IS NULL OR octet_length(source_event_id)<=65536),
  CHECK(feature IS NULL OR octet_length(feature)<=65536),
  CHECK(consent_version IS NULL OR octet_length(consent_version)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE moments_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  author_id uuid NOT NULL,
  text text NOT NULL CHECK(length(text)<=100),
  mood text NOT NULL,
  audience text NOT NULL,
  area_id uuid,
  expires_at timestamptz NOT NULL,
  deleted_at timestamptz,
  capture_receipt_id uuid,
  CHECK(expires_at>created_at),
  UNIQUE(capture_receipt_id),
  CHECK(mood IS NULL OR octet_length(mood)<=65536),
  CHECK(audience IS NULL OR octet_length(audience)<=65536)
);

CREATE TABLE moments_attachments (
  moment_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(moment_id,media_id),
  UNIQUE(moment_id,position)
);

CREATE TABLE share_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  moment_id uuid,
  category text,
  subcategory text,
  note text NOT NULL CHECK(length(note)<=100),
  status text NOT NULL CHECK(status IN ('pending','approved','refused','retracted','expired')),
  expires_at timestamptz,
  decided_at timestamptz,
  CHECK(requester_id<>recipient_id),
  CHECK(num_nonnulls(moment_id,category)=1),
  CHECK(category IS NOT NULL OR subcategory IS NULL),
  CHECK((status='pending')=(decided_at IS NULL)),
  CHECK(expires_at IS NULL OR expires_at>created_at),
  CHECK(category IS NULL OR octet_length(category)<=65536),
  CHECK(subcategory IS NULL OR octet_length(subcategory)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE share_request_media (
  request_id uuid NOT NULL,
  media_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(request_id,media_id)
);

CREATE TABLE communities_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  owner_id uuid NOT NULL,
  handle text NOT NULL UNIQUE CHECK(handle=lower(handle) AND handle ~ '^[a-z0-9_]+$'),
  title text NOT NULL,
  emoji text NOT NULL,
  category text NOT NULL,
  custom_tag text,
  description text NOT NULL,
  address text NOT NULL,
  privacy text NOT NULL,
  status text NOT NULL CHECK(status IN ('active','archived')),
  area_id uuid,
  CHECK(handle IS NULL OR octet_length(handle)<=65536),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(emoji IS NULL OR octet_length(emoji)<=65536),
  CHECK(category IS NULL OR octet_length(category)<=65536),
  CHECK(custom_tag IS NULL OR octet_length(custom_tag)<=65536),
  CHECK(description IS NULL OR octet_length(description)<=65536),
  CHECK(address IS NULL OR octet_length(address)<=65536),
  CHECK(privacy IS NULL OR octet_length(privacy)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE communities_memberships (
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL CHECK(status IN ('invited','active','left')),
  joined_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(community_id,user_id),
  CHECK(status<>'active' OR joined_at IS NOT NULL),
  CHECK(role IS NULL OR octet_length(role)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE communities_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  community_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','accepted','refused','revoked','expired')),
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  CHECK(inviter_id<>recipient_id),
  CHECK(expires_at>created_at),
  CHECK((status='pending')=(decided_at IS NULL)),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE communities_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  moderator_id uuid NOT NULL,
  reason text NOT NULL,
  revoked_at timestamptz,
  CHECK(reason IS NULL OR octet_length(reason)<=65536)
);

CREATE TABLE communities_announcements (
  community_id uuid NOT NULL,
  author_id uuid NOT NULL,
  text text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(community_id),
  CHECK(text IS NULL OR octet_length(text)<=65536)
);

CREATE TABLE share_membership_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  request_id uuid NOT NULL,
  community_id uuid NOT NULL,
  operation_id uuid NOT NULL UNIQUE,
  status text NOT NULL CHECK(status IN ('pending','acknowledged','failed')),
  acknowledged_at timestamptz,
  UNIQUE(request_id,community_id),
  CHECK((status='acknowledged')=(acknowledged_at IS NOT NULL)),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE payments_assets (
  id text NOT NULL,
  network text NOT NULL,
  symbol text NOT NULL,
  precision integer NOT NULL CHECK(precision BETWEEN 0 AND 38),
  contract_address text,
  enabled boolean NOT NULL,
  policy_version text NOT NULL,
  PRIMARY KEY(id),
  CHECK(id IS NULL OR octet_length(id)<=65536),
  CHECK(network IS NULL OR octet_length(network)<=65536),
  CHECK(symbol IS NULL OR octet_length(symbol)<=65536),
  CHECK(contract_address IS NULL OR octet_length(contract_address)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE payments_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  network text NOT NULL,
  address text NOT NULL,
  verified_at timestamptz NOT NULL,
  proof_digest text NOT NULL CHECK(proof_digest ~ '^[0-9a-f]{64}$'),
  revoked_at timestamptz,
  CHECK(network IS NULL OR octet_length(network)<=65536),
  CHECK(address IS NULL OR octet_length(address)<=65536),
  CHECK(proof_digest IS NULL OR octet_length(proof_digest)<=65536)
);

CREATE TABLE payments_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  payer_id uuid NOT NULL,
  payee_id uuid,
  destination text NOT NULL,
  asset_id text NOT NULL,
  amount numeric(38,0) NOT NULL CHECK(amount>0),
  purpose text NOT NULL,
  status text NOT NULL CHECK(status IN ('created','pending','confirmed','failed','cancelled')),
  operation_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  CHECK(expires_at>created_at),
  CHECK(destination IS NULL OR octet_length(destination)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536),
  CHECK(purpose IS NULL OR octet_length(purpose)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(operation_key IS NULL OR octet_length(operation_key)<=65536)
);

CREATE TABLE payments_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  intent_id uuid NOT NULL,
  provider text NOT NULL,
  network text NOT NULL,
  external_id text NOT NULL,
  status text NOT NULL,
  amount numeric(38,0) NOT NULL CHECK(amount>0),
  asset_id text NOT NULL,
  received_at timestamptz NOT NULL,
  verified_payload_digest text NOT NULL CHECK(verified_payload_digest ~ '^[0-9a-f]{64}$'),
  reversal_of uuid,
  UNIQUE(provider,network,external_id),
  CHECK(reversal_of IS NULL OR reversal_of<>id),
  CHECK(provider IS NULL OR octet_length(provider)<=65536),
  CHECK(network IS NULL OR octet_length(network)<=65536),
  CHECK(external_id IS NULL OR octet_length(external_id)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536),
  CHECK(verified_payload_digest IS NULL OR octet_length(verified_payload_digest)<=65536)
);

CREATE TABLE payments_reconciliations (
  intent_id uuid NOT NULL,
  attempt integer NOT NULL CHECK(attempt>0),
  next_attempt_at timestamptz NOT NULL,
  status text NOT NULL,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(intent_id,attempt),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(error_code IS NULL OR octet_length(error_code)<=65536)
);

CREATE TABLE rewards_assets (
  id text NOT NULL,
  unit_name text NOT NULL,
  precision integer NOT NULL CHECK(precision BETWEEN 0 AND 38),
  transferable boolean NOT NULL,
  policy_version text NOT NULL,
  PRIMARY KEY(id),
  CHECK(id IS NULL OR octet_length(id)<=65536),
  CHECK(unit_name IS NULL OR octet_length(unit_name)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE rewards_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid,
  system_account text,
  asset_id text NOT NULL,
  CHECK(num_nonnulls(user_id,system_account)=1),
  UNIQUE(user_id,asset_id),
  UNIQUE(system_account,asset_id),
  CHECK(system_account IS NULL OR octet_length(system_account)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536)
);

CREATE TABLE rewards_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_in_xid xid8 NOT NULL DEFAULT pg_current_xact_id(),
  kind text NOT NULL,
  policy_version text NOT NULL,
  operation_key text NOT NULL UNIQUE,
  reversal_of uuid,
  committed_at timestamptz NOT NULL,
  PRIMARY KEY(id),
  CHECK(reversal_of IS NULL OR reversal_of<>id),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(operation_key IS NULL OR octet_length(operation_key)<=65536)
);

CREATE TABLE rewards_entries (
  transaction_id uuid NOT NULL,
  account_id uuid NOT NULL,
  amount numeric(38,0) NOT NULL CHECK(amount<>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(transaction_id,account_id)
);

CREATE TABLE rewards_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  beneficiary_id uuid NOT NULL,
  proof_owner text NOT NULL,
  proof_id text NOT NULL,
  rule_version text NOT NULL,
  transaction_id uuid NOT NULL,
  UNIQUE(transaction_id),
  UNIQUE(beneficiary_id,proof_owner,proof_id,rule_version),
  CHECK(proof_owner IS NULL OR octet_length(proof_owner)<=65536),
  CHECK(proof_id IS NULL OR octet_length(proof_id)<=65536),
  CHECK(rule_version IS NULL OR octet_length(rule_version)<=65536)
);

CREATE TABLE rewards_streak_days (
  user_id uuid NOT NULL,
  local_day date NOT NULL,
  timezone text NOT NULL,
  rule_version text NOT NULL,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,local_day,rule_version),
  CHECK(timezone IS NULL OR octet_length(timezone)<=65536),
  CHECK(rule_version IS NULL OR octet_length(rule_version)<=65536)
);

CREATE TABLE marketplace_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  owner_id uuid NOT NULL,
  side text NOT NULL CHECK(side IN ('buy','sell')),
  status text NOT NULL CHECK(status IN ('open','closed','cancelled')),
  asset_id text NOT NULL,
  quantity numeric(38,0) NOT NULL CHECK(quantity>0),
  quote_asset_id text NOT NULL,
  quote_amount numeric(38,0) NOT NULL CHECK(quote_amount>0),
  meetup text NOT NULL,
  payment_method text NOT NULL,
  remaining_quantity numeric(38,0) NOT NULL CHECK(remaining_quantity>=0),
  CHECK(remaining_quantity<=quantity),
  CHECK(side IS NULL OR octet_length(side)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536),
  CHECK(quote_asset_id IS NULL OR octet_length(quote_asset_id)<=65536),
  CHECK(meetup IS NULL OR octet_length(meetup)<=65536),
  CHECK(payment_method IS NULL OR octet_length(payment_method)<=65536)
);

CREATE TABLE marketplace_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  offer_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  quantity numeric(38,0) NOT NULL CHECK(quantity>0),
  agreed_terms jsonb NOT NULL,
  status text NOT NULL CHECK(status IN ('requested','accepted','cancelled','completed')),
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK((status='completed')=(completed_at IS NOT NULL)),
  CHECK((status='cancelled')=(cancelled_at IS NOT NULL)),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE marketplace_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  deal_id uuid NOT NULL,
  actor_id uuid,
  from_state text NOT NULL,
  to_state text NOT NULL,
  occurred_at timestamptz NOT NULL,
  operation_key text NOT NULL UNIQUE,
  CHECK(from_state<>to_state),
  CHECK(from_state IS NULL OR octet_length(from_state)<=65536),
  CHECK(to_state IS NULL OR octet_length(to_state)<=65536),
  CHECK(operation_key IS NULL OR octet_length(operation_key)<=65536)
);

CREATE TABLE marketplace_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  deal_id uuid NOT NULL,
  payment_receipt_id uuid,
  rewards_transaction_id uuid,
  CHECK(num_nonnulls(payment_receipt_id,rewards_transaction_id)=1),
  UNIQUE(payment_receipt_id),
  UNIQUE(rewards_transaction_id)
);

CREATE TABLE places_external_ids (
  place_id uuid NOT NULL,
  provider text NOT NULL,
  external_id text NOT NULL,
  source_version text NOT NULL,
  fetched_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(provider,external_id),
  CHECK(provider IS NULL OR octet_length(provider)<=65536),
  CHECK(external_id IS NULL OR octet_length(external_id)<=65536),
  CHECK(source_version IS NULL OR octet_length(source_version)<=65536)
);

CREATE TABLE places_details (
  place_id uuid NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  website text,
  hours jsonb,
  provenance jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(place_id),
  CHECK(address IS NULL OR octet_length(address)<=65536),
  CHECK(description IS NULL OR octet_length(description)<=65536),
  CHECK(website IS NULL OR octet_length(website)<=65536)
);

CREATE TABLE places_media_links (
  place_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  provenance text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(place_id,media_id),
  UNIQUE(place_id,position),
  CHECK(provenance IS NULL OR octet_length(provenance)<=65536)
);

CREATE TABLE places_saves (
  place_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(place_id,user_id)
);

CREATE TABLE contributions_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  submitter_id uuid NOT NULL,
  place_id uuid,
  kind text NOT NULL CHECK(kind IN ('suggestion','correction','issue','recommendation')),
  status text NOT NULL CHECK(status IN ('pending','approved','rejected','withdrawn')),
  proposed_name text,
  proposed_category text,
  proposed_address text,
  proposed_location geometry(Point,4326),
  description text NOT NULL,
  decided_by uuid,
  decided_at timestamptz,
  policy_version text NOT NULL,
  CHECK(kind NOT IN ('correction','issue') OR place_id IS NOT NULL),
  CHECK((status='pending')=(decided_at IS NULL)),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(proposed_name IS NULL OR octet_length(proposed_name)<=65536),
  CHECK(proposed_category IS NULL OR octet_length(proposed_category)<=65536),
  CHECK(proposed_address IS NULL OR octet_length(proposed_address)<=65536),
  CHECK(description IS NULL OR octet_length(description)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE contributions_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  case_id uuid,
  place_id uuid NOT NULL,
  user_id uuid NOT NULL,
  verdict text NOT NULL CHECK(verdict IN ('yes','changed','not_here')),
  proof_id uuid,
  observed_at timestamptz NOT NULL,
  CHECK(verdict IS NULL OR octet_length(verdict)<=65536)
);

CREATE TABLE contributions_atmosphere (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  place_id uuid NOT NULL,
  user_id uuid NOT NULL,
  label text NOT NULL CHECK(label IN ('HighVibes','Vibing','LowVibes')),
  text text,
  proof_id uuid,
  observed_at timestamptz NOT NULL,
  hidden_at timestamptz,
  policy_version text NOT NULL,
  CHECK(label IS NULL OR octet_length(label)<=65536),
  CHECK(text IS NULL OR octet_length(text)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE contributions_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  case_id uuid,
  atmosphere_id uuid,
  reviewer_id uuid NOT NULL,
  decision text NOT NULL,
  reason text NOT NULL,
  decided_at timestamptz NOT NULL,
  CHECK(num_nonnulls(case_id,atmosphere_id)=1),
  CHECK(decision IS NULL OR octet_length(decision)<=65536),
  CHECK(reason IS NULL OR octet_length(reason)<=65536)
);

CREATE TABLE contributions_meter_projection (
  place_id uuid NOT NULL,
  label text CHECK(label IN ('HighVibes','Vibing','LowVibes')),
  observation_count integer NOT NULL CHECK(observation_count>=0),
  computed_at timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  policy_version text NOT NULL,
  PRIMARY KEY(place_id),
  CHECK(valid_until>computed_at),
  CHECK(label IS NULL OR octet_length(label)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536)
);

CREATE TABLE checkins_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL,
  proof_id uuid NOT NULL,
  mood text NOT NULL,
  audience text NOT NULL,
  status text NOT NULL CHECK(status IN ('active','ended','revoked','expired')),
  started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  UNIQUE(proof_id,user_id),
  CHECK(expires_at>started_at),
  CHECK((status='active')=(ended_at IS NULL)),
  CHECK(mood IS NULL OR octet_length(mood)<=65536),
  CHECK(audience IS NULL OR octet_length(audience)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE curation_trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  author_id uuid NOT NULL,
  title text NOT NULL,
  story text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL,
  duration_minutes integer CHECK(duration_minutes>0),
  time_of_day text NOT NULL,
  status text NOT NULL CHECK(status IN ('draft','published','withdrawn','deleted')),
  published_at timestamptz,
  deleted_at timestamptz,
  published_revision_id uuid,
  CHECK(status<>'published' OR (published_at IS NOT NULL AND published_revision_id IS NOT NULL)),
  CHECK((status='deleted')=(deleted_at IS NOT NULL)),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(story IS NULL OR octet_length(story)<=65536),
  CHECK(category IS NULL OR octet_length(category)<=65536),
  CHECK(tags IS NULL OR octet_length(tags::text)<=65536),
  CHECK(time_of_day IS NULL OR octet_length(time_of_day)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE curation_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  trail_id uuid NOT NULL,
  ordinal integer NOT NULL CHECK(ordinal>=0),
  place_id uuid,
  activity_id uuid,
  event_id uuid,
  note text NOT NULL,
  tips text NOT NULL,
  planned_offset_minutes integer CHECK(planned_offset_minutes>=0),
  CHECK(num_nonnulls(place_id,activity_id,event_id)=1),
  UNIQUE(trail_id,ordinal),
  UNIQUE(id,trail_id),
  CHECK(note IS NULL OR octet_length(note)<=65536),
  CHECK(tips IS NULL OR octet_length(tips)<=65536)
);

CREATE TABLE curation_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  created_in_xid xid8 NOT NULL DEFAULT pg_current_xact_id(),
  trail_id uuid NOT NULL,
  revision integer NOT NULL CHECK(revision>0),
  author_id uuid NOT NULL,
  title text NOT NULL,
  story text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL,
  duration_minutes integer CHECK(duration_minutes>0),
  time_of_day text NOT NULL,
  published_at timestamptz NOT NULL,
  UNIQUE(trail_id,revision),
  UNIQUE(id,trail_id),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(story IS NULL OR octet_length(story)<=65536),
  CHECK(category IS NULL OR octet_length(category)<=65536),
  CHECK(tags IS NULL OR octet_length(tags::text)<=65536),
  CHECK(time_of_day IS NULL OR octet_length(time_of_day)<=65536)
);

CREATE TABLE curation_revision_stops (
  revision_id uuid NOT NULL,
  ordinal integer NOT NULL CHECK(ordinal>=0),
  place_id uuid,
  activity_id uuid,
  event_id uuid,
  note text NOT NULL,
  tips text NOT NULL,
  planned_offset_minutes integer CHECK(planned_offset_minutes>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(revision_id,ordinal),
  CHECK(num_nonnulls(place_id,activity_id,event_id)=1),
  CHECK(note IS NULL OR octet_length(note)<=65536),
  CHECK(tips IS NULL OR octet_length(tips)<=65536)
);

CREATE TABLE curation_lineage (
  child_id uuid NOT NULL,
  parent_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('adopt','remix')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(child_id),
  CHECK(child_id<>parent_id),
  CHECK(kind IS NULL OR octet_length(kind)<=65536)
);

CREATE TABLE curation_trail_saves (
  trail_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(trail_id,user_id)
);

CREATE TABLE curation_trail_reactions (
  trail_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(trail_id,user_id)
);

CREATE TABLE curation_media_links (
  trail_id uuid NOT NULL,
  stop_id uuid,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(trail_id,media_id),
  UNIQUE(trail_id,position)
);

CREATE TABLE curation_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  editor_id uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('coordinates','gems','guide')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK(status IN ('draft','published','withdrawn')),
  area_id uuid,
  published_at timestamptz,
  CHECK(status<>'published' OR published_at IS NOT NULL),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(body IS NULL OR octet_length(body)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE curation_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  collection_id uuid NOT NULL,
  place_id uuid,
  trail_id uuid,
  position integer NOT NULL CHECK(position>=0),
  title text NOT NULL,
  story text NOT NULL,
  CHECK(num_nonnulls(place_id,trail_id)=1),
  UNIQUE(collection_id,position),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(story IS NULL OR octet_length(story)<=65536)
);

CREATE TABLE curation_progress (
  user_id uuid NOT NULL,
  collection_item_id uuid NOT NULL,
  action text NOT NULL,
  proof_id uuid,
  completed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,collection_item_id,action),
  CHECK(action IS NULL OR octet_length(action)<=65536)
);

CREATE TABLE guardian_profiles (
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('PRO','LOCAL_LEGEND')),
  status text NOT NULL CHECK(status IN ('application','active','suspended','withdrawn')),
  bio text NOT NULL,
  languages text[] NOT NULL,
  specialties text[] NOT NULL,
  hire_visible boolean NOT NULL,
  hourly_amount numeric(38,0) CHECK(hourly_amount>=0),
  asset_id text,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id),
  CHECK(kind<>'LOCAL_LEGEND' OR hourly_amount IS NULL OR hourly_amount=0),
  CHECK(hourly_amount IS NULL OR hourly_amount=0 OR asset_id IS NOT NULL),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(bio IS NULL OR octet_length(bio)<=65536),
  CHECK(languages IS NULL OR octet_length(languages::text)<=65536),
  CHECK(specialties IS NULL OR octet_length(specialties::text)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536)
);

CREATE TABLE guardian_areas (
  guardian_id uuid NOT NULL,
  area_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(guardian_id,area_id)
);

CREATE TABLE guardian_trails (
  guardian_id uuid NOT NULL,
  trail_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(guardian_id,trail_id),
  UNIQUE(guardian_id,position)
);

CREATE TABLE guardian_selfies (
  guardian_id uuid NOT NULL,
  media_id uuid NOT NULL,
  capture_receipt_id uuid NOT NULL,
  captured_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('current','expired','revoked')),
  PRIMARY KEY(guardian_id),
  UNIQUE(capture_receipt_id),
  CHECK(expires_at>captured_at),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE guardian_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  capability text NOT NULL,
  verification_case_id uuid,
  granted_by uuid NOT NULL,
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK(capability IS NULL OR octet_length(capability)<=65536)
);

CREATE TABLE reservations_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  trail_id uuid NOT NULL,
  itinerary_revision_id uuid NOT NULL,
  guardian_id uuid NOT NULL,
  title text NOT NULL,
  about text NOT NULL,
  duration_minutes integer NOT NULL CHECK(duration_minutes>0),
  flat_amount numeric(38,0) NOT NULL CHECK(flat_amount>=0),
  asset_id text NOT NULL,
  meeting_point geometry(Point,4326) NOT NULL,
  meeting_label text NOT NULL,
  included_items text[] NOT NULL,
  languages text[] NOT NULL,
  age text,
  accessibility text,
  expectations text,
  cancellation_terms text,
  status text NOT NULL CHECK(status IN ('draft','published','withdrawn')),
  UNIQUE(trail_id),
  UNIQUE(id,guardian_id),
  UNIQUE(id,trail_id),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(about IS NULL OR octet_length(about)<=65536),
  CHECK(asset_id IS NULL OR octet_length(asset_id)<=65536),
  CHECK(meeting_label IS NULL OR octet_length(meeting_label)<=65536),
  CHECK(included_items IS NULL OR octet_length(included_items::text)<=65536),
  CHECK(languages IS NULL OR octet_length(languages::text)<=65536),
  CHECK(age IS NULL OR octet_length(age)<=65536),
  CHECK(accessibility IS NULL OR octet_length(accessibility)<=65536),
  CHECK(expectations IS NULL OR octet_length(expectations)<=65536),
  CHECK(cancellation_terms IS NULL OR octet_length(cancellation_terms)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE reservations_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  tour_id uuid,
  guardian_id uuid NOT NULL,
  service_kind text NOT NULL CHECK(service_kind IN ('TOUR','HOURLY')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK(capacity>0),
  status text NOT NULL CHECK(status IN ('available','unavailable','cancelled')),
  CHECK(ends_at>starts_at),
  CHECK((service_kind='TOUR')=(tour_id IS NOT NULL)),
  UNIQUE(id,service_kind),
  UNIQUE(id,tour_id),
  CHECK(service_kind IS NULL OR octet_length(service_kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE reservations_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  requester_id uuid NOT NULL,
  slot_id uuid NOT NULL,
  service_kind text NOT NULL CHECK(service_kind IN ('TOUR','HOURLY')),
  tour_id uuid,
  trail_id uuid,
  party_size integer NOT NULL CHECK(party_size>0),
  status text NOT NULL CHECK(status IN ('requested','accepted','rejected','cancelled','completed','expired')),
  terms_snapshot jsonb NOT NULL,
  itinerary_revision_id uuid,
  offering_version integer CHECK(offering_version>0),
  expires_at timestamptz,
  decided_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  CHECK((service_kind='TOUR' AND num_nonnulls(tour_id,trail_id,itinerary_revision_id,offering_version)=4) OR (service_kind='HOURLY' AND num_nonnulls(tour_id,trail_id,itinerary_revision_id,offering_version)=0)),
  CHECK((status='completed')=(completed_at IS NOT NULL)),
  CHECK((status='cancelled')=(cancelled_at IS NOT NULL)),
  CHECK(status='requested' OR decided_at IS NOT NULL),
  CHECK(service_kind IS NULL OR octet_length(service_kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE reservations_settlements (
  booking_id uuid NOT NULL,
  payment_intent_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(booking_id,payment_intent_id),
  UNIQUE(payment_intent_id)
);

CREATE TABLE guardian_handshakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  guardian_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  booking_id uuid,
  status text NOT NULL CHECK(status IN ('pending','verified','rejected')),
  proof_kind text NOT NULL,
  proof_reference text NOT NULL,
  encounter_key text NOT NULL UNIQUE,
  verified_at timestamptz,
  expires_at timestamptz,
  CHECK(guardian_id<>visitor_id),
  CHECK((status='verified')=(verified_at IS NOT NULL)),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(proof_kind IS NULL OR octet_length(proof_kind)<=65536),
  CHECK(proof_reference IS NULL OR octet_length(proof_reference)<=65536),
  CHECK(encounter_key IS NULL OR octet_length(encounter_key)<=65536)
);

CREATE TABLE guardian_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  handshake_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
  text text NOT NULL,
  verified_case_id uuid NOT NULL,
  UNIQUE(handshake_id,reviewer_id),
  CHECK(text IS NULL OR octet_length(text)<=65536)
);

CREATE TABLE messaging_effect_catalog (
  id text NOT NULL,
  label_key text NOT NULL,
  license text NOT NULL,
  source text NOT NULL,
  media_id uuid,
  synthesis_spec jsonb,
  enabled boolean NOT NULL,
  PRIMARY KEY(id),
  CHECK(num_nonnulls(media_id,synthesis_spec)=1),
  CHECK(id IS NULL OR octet_length(id)<=65536),
  CHECK(label_key IS NULL OR octet_length(label_key)<=65536),
  CHECK(license IS NULL OR octet_length(license)<=65536),
  CHECK(source IS NULL OR octet_length(source)<=65536)
);

CREATE TABLE messaging_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  kind text NOT NULL CHECK(kind IN ('DIRECT','ROOM','MATCH','SERVICE','TRADE')),
  status text NOT NULL CHECK(status IN ('active','closed')),
  next_sequence bigint NOT NULL DEFAULT 1 CHECK(next_sequence>0),
  community_id uuid,
  relationship_id uuid,
  deal_id uuid,
  UNIQUE(community_id),
  UNIQUE(relationship_id),
  UNIQUE(deal_id),
  CHECK((kind='ROOM' AND community_id IS NOT NULL AND num_nonnulls(community_id,relationship_id,deal_id)=1) OR (kind='MATCH' AND relationship_id IS NOT NULL AND num_nonnulls(community_id,relationship_id,deal_id)=1) OR (kind='TRADE' AND deal_id IS NOT NULL AND num_nonnulls(community_id,relationship_id,deal_id)=1) OR (kind IN ('DIRECT','SERVICE') AND num_nonnulls(community_id,relationship_id,deal_id)=0)),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE messaging_service_contexts (
  conversation_id uuid NOT NULL,
  guardian_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(conversation_id),
  UNIQUE(guardian_id,requester_id),
  CHECK(guardian_id<>requester_id)
);

CREATE TABLE messaging_service_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  conversation_id uuid NOT NULL,
  trail_id uuid,
  itinerary_revision_id uuid,
  tour_id uuid,
  booking_id uuid,
  operation_id uuid NOT NULL,
  UNIQUE(id,conversation_id),
  UNIQUE(conversation_id,operation_id),
  CHECK((trail_id IS NULL)=(itinerary_revision_id IS NULL)),
  CHECK(num_nonnulls(itinerary_revision_id,tour_id,booking_id)>0),
  CHECK(tour_id IS NULL OR itinerary_revision_id IS NOT NULL)
);

CREATE TABLE messaging_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(conversation_id,user_id),
  CHECK(left_at IS NULL OR left_at>=joined_at)
);

CREATE TABLE messaging_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  conversation_id uuid NOT NULL,
  sender_id uuid,
  service_inquiry_id uuid,
  sequence bigint NOT NULL CHECK(sequence>0),
  client_nonce uuid NOT NULL,
  kind text NOT NULL CHECK(kind IN ('text','image','video','audio','effect','poll','system')),
  status text NOT NULL CHECK(status IN ('visible','redacted')),
  text text,
  effect_id text,
  redacted_at timestamptz,
  expires_at timestamptz NOT NULL,
  retention_policy_version text NOT NULL CHECK(length(btrim(retention_policy_version)) BETWEEN 1 AND 128),
  UNIQUE(conversation_id,sequence),
  UNIQUE NULLS NOT DISTINCT(conversation_id,sender_id,client_nonce),
  CHECK(expires_at>created_at),
  CHECK((status='redacted')=(redacted_at IS NOT NULL)),
  CHECK(status<>'redacted' OR text IS NULL),
  CHECK((kind='effect' AND effect_id IS NOT NULL) OR (kind<>'effect' AND effect_id IS NULL)),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(text IS NULL OR octet_length(text)<=65536),
  CHECK(effect_id IS NULL OR octet_length(effect_id)<=65536),
  CHECK(retention_policy_version IS NULL OR octet_length(retention_policy_version)<=65536)
);

CREATE TABLE messaging_attachments (
  message_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(message_id,media_id),
  UNIQUE(message_id,position)
);

CREATE TABLE messaging_read_cursors (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  through_sequence bigint NOT NULL CHECK(through_sequence>=0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(conversation_id,user_id)
);

CREATE TABLE messaging_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  message_id uuid NOT NULL,
  question text NOT NULL CHECK(length(question) BETWEEN 1 AND 80),
  status text NOT NULL CHECK(status IN ('open','closed')),
  closes_at timestamptz,
  creator_id uuid NOT NULL,
  UNIQUE(message_id),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE messaging_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  poll_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  label text NOT NULL CHECK(length(label) BETWEEN 1 AND 30),
  UNIQUE(poll_id,position),
  UNIQUE(id,poll_id)
);

CREATE TABLE messaging_poll_votes (
  poll_id uuid NOT NULL,
  option_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(poll_id,user_id,option_id)
);

CREATE TABLE presence_sessions (
  session_key text NOT NULL CHECK(session_key ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consent_version integer NOT NULL CHECK(consent_version>=0),
  PRIMARY KEY(session_key,conversation_id),
  CHECK(expires_at>last_seen_at),
  CHECK(session_key IS NULL OR octet_length(session_key)<=65536)
);

CREATE TABLE flash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  host_id uuid NOT NULL,
  place_id uuid,
  location geometry(Point,4326),
  title text NOT NULL,
  description text NOT NULL,
  rules text NOT NULL,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  entry_type text NOT NULL,
  advertised_price text,
  entry_text text,
  creator_comment text,
  parking text,
  transit text,
  reward_description text,
  status text NOT NULL CHECK(status IN ('draft','active','cancelled','expired')),
  CHECK(num_nonnulls(place_id,location)=1),
  CHECK(expires_at>starts_at),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(description IS NULL OR octet_length(description)<=65536),
  CHECK(rules IS NULL OR octet_length(rules)<=65536),
  CHECK(entry_type IS NULL OR octet_length(entry_type)<=65536),
  CHECK(advertised_price IS NULL OR octet_length(advertised_price)<=65536),
  CHECK(entry_text IS NULL OR octet_length(entry_text)<=65536),
  CHECK(creator_comment IS NULL OR octet_length(creator_comment)<=65536),
  CHECK(parking IS NULL OR octet_length(parking)<=65536),
  CHECK(transit IS NULL OR octet_length(transit)<=65536),
  CHECK(reward_description IS NULL OR octet_length(reward_description)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE flash_participants (
  flash_id uuid NOT NULL,
  user_id uuid NOT NULL,
  intention text NOT NULL CHECK(intention IN ('interested','going')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(flash_id,user_id),
  CHECK(intention IS NULL OR octet_length(intention)<=65536)
);

CREATE TABLE flash_hunts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  flash_id uuid NOT NULL,
  user_id uuid NOT NULL,
  proof_id uuid,
  status text NOT NULL CHECK(status IN ('started','proven','claimed','expired')),
  claimed_at timestamptz,
  UNIQUE(flash_id,user_id),
  CHECK((status='claimed')=(claimed_at IS NOT NULL)),
  CHECK(status NOT IN ('proven','claimed') OR proof_id IS NOT NULL),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE flash_media_links (
  flash_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(flash_id,media_id),
  UNIQUE(flash_id,position)
);

CREATE TABLE gatherings_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  host_id uuid NOT NULL,
  place_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK(status IN ('active','cancelled','completed')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer CHECK(capacity>0),
  CHECK(ends_at>starts_at),
  CHECK(title IS NULL OR octet_length(title)<=65536),
  CHECK(description IS NULL OR octet_length(description)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE gatherings_participants (
  gathering_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('joined','left')),
  joined_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(gathering_id,user_id),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE geo_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  owner_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  name text NOT NULL,
  center geometry(Point,4326) NOT NULL,
  radius_m integer NOT NULL DEFAULT 200 CHECK(radius_m IN (150,200,250,500)),
  enabled boolean NOT NULL,
  CHECK(owner_id<>subject_id),
  CHECK(name IS NULL OR octet_length(name)<=65536)
);

CREATE TABLE geo_fence_states (
  fence_id uuid NOT NULL,
  state text NOT NULL CHECK(state IN ('unknown','inside','outside')),
  last_observation_id text,
  changed_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  PRIMARY KEY(fence_id),
  CHECK(state IS NULL OR octet_length(state)<=65536),
  CHECK(last_observation_id IS NULL OR octet_length(last_observation_id)<=65536)
);

CREATE TABLE geo_fence_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  fence_id uuid NOT NULL,
  transition_key text NOT NULL UNIQUE,
  kind text NOT NULL CHECK(kind IN ('arrival','departure')),
  occurred_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  read_at timestamptz,
  CHECK(expires_at>occurred_at),
  CHECK(transition_key IS NULL OR octet_length(transition_key)<=65536),
  CHECK(kind IS NULL OR octet_length(kind)<=65536)
);

CREATE TABLE recognition_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  kind text NOT NULL,
  period_key text NOT NULL,
  policy_version text NOT NULL,
  status text NOT NULL CHECK(status IN ('planned','running','completed','failed')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  UNIQUE(kind,period_key),
  CHECK(ends_at>starts_at),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(period_key IS NULL OR octet_length(period_key)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE recognition_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  period_id uuid NOT NULL,
  user_id uuid NOT NULL,
  place_id uuid,
  rank integer NOT NULL CHECK(rank>0),
  evidence jsonb NOT NULL,
  UNIQUE NULLS NOT DISTINCT(period_id,user_id,place_id)
);

CREATE TABLE notification_preferences (
  user_id uuid NOT NULL,
  enabled boolean NOT NULL,
  sound boolean NOT NULL,
  radius_m integer NOT NULL DEFAULT 2000 CHECK(radius_m BETWEEN 500 AND 10000 AND radius_m%500=0),
  channels text[] NOT NULL,
  locale text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id),
  CHECK(channels IS NULL OR octet_length(channels::text)<=65536),
  CHECK(locale IS NULL OR octet_length(locale)<=65536)
);

CREATE TABLE notification_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  recipient_id uuid NOT NULL,
  source_event_id uuid NOT NULL,
  type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  read_at timestamptz,
  dismissed_at timestamptz,
  UNIQUE(recipient_id,source_event_id,type),
  CHECK(expires_at>created_at),
  CHECK(type IS NULL OR octet_length(type)<=65536),
  CHECK(target_type IS NULL OR octet_length(target_type)<=65536)
);

CREATE TABLE notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  channel text NOT NULL,
  provider text NOT NULL,
  endpoint_ciphertext text NOT NULL,
  endpoint_digest text NOT NULL UNIQUE CHECK(endpoint_digest ~ '^[0-9a-f]{64}$'),
  enabled boolean NOT NULL,
  verified_at timestamptz,
  revoked_at timestamptz,
  CHECK(NOT enabled OR (verified_at IS NOT NULL AND revoked_at IS NULL)),
  CHECK(channel IS NULL OR octet_length(channel)<=65536),
  CHECK(provider IS NULL OR octet_length(provider)<=65536),
  CHECK(endpoint_ciphertext IS NULL OR octet_length(endpoint_ciphertext)<=65536),
  CHECK(endpoint_digest IS NULL OR octet_length(endpoint_digest)<=65536)
);

CREATE TABLE notification_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  activity_id uuid,
  event_id uuid,
  source_version integer NOT NULL CHECK(source_version>0),
  due_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('scheduled','cancelled','dispatched','expired')),
  CHECK(num_nonnulls(activity_id,event_id)=1),
  UNIQUE(user_id,activity_id,kind),
  UNIQUE(user_id,event_id,kind),
  CHECK(kind IS NULL OR octet_length(kind)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  inbox_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','sending','acknowledged','failed','expired')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL,
  provider_receipt text,
  expires_at timestamptz NOT NULL,
  UNIQUE(inbox_id,subscription_id),
  CHECK(expires_at>created_at),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(provider_receipt IS NULL OR octet_length(provider_receipt)<=65536)
);

CREATE TABLE notification_attempts (
  delivery_id uuid NOT NULL,
  attempt integer NOT NULL CHECK(attempt>0),
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  outcome text,
  error_code text,
  receipt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(delivery_id,attempt),
  CHECK(ended_at IS NULL OR ended_at>=started_at),
  CHECK(outcome IS NULL OR octet_length(outcome)<=65536),
  CHECK(error_code IS NULL OR octet_length(error_code)<=65536),
  CHECK(receipt IS NULL OR octet_length(receipt)<=65536)
);

CREATE TABLE challenge_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  prompt text NOT NULL CHECK(length(prompt) BETWEEN 1 AND 60),
  status text NOT NULL CHECK(status IN ('pending','responded','refused','expired')),
  opened_at timestamptz NOT NULL,
  deadline_at timestamptz NOT NULL,
  decided_at timestamptz,
  CHECK(sender_id<>recipient_id),
  CHECK(deadline_at=opened_at+interval '33000 milliseconds'),
  CHECK((status='pending')=(decided_at IS NULL)),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);

CREATE TABLE challenge_flashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  trigger_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK(status IN ('active','responded','denied','expired')),
  opened_at timestamptz NOT NULL,
  deadline_at timestamptz NOT NULL,
  decided_at timestamptz,
  schedule_policy text,
  CHECK(deadline_at=opened_at+interval '60000 milliseconds'),
  CHECK((status='active')=(decided_at IS NULL)),
  CHECK(trigger_id IS NULL OR octet_length(trigger_id)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536),
  CHECK(schedule_policy IS NULL OR octet_length(schedule_policy)<=65536)
);

CREATE TABLE challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  check_id uuid,
  flash_id uuid,
  actor_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  capture_receipt_id uuid NOT NULL,
  submitted_at timestamptz NOT NULL,
  CHECK(num_nonnulls(check_id,flash_id)=1),
  UNIQUE(check_id),
  UNIQUE(flash_id),
  UNIQUE(capture_receipt_id),
  UNIQUE(actor_id,operation_id)
);

CREATE TABLE challenge_media_links (
  submission_id uuid NOT NULL,
  media_id uuid NOT NULL,
  camera_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(submission_id,media_id),
  UNIQUE(submission_id,camera_role),
  CHECK(camera_role IS NULL OR octet_length(camera_role)<=65536)
);

CREATE TABLE challenge_reactions (
  check_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  reaction text NOT NULL CHECK(reaction IN ('fire','cap','vibing')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(check_id,actor_id),
  CHECK(reaction IS NULL OR octet_length(reaction)<=65536)
);

CREATE TABLE challenge_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  CHECK(updated_at>=created_at),
  user_id uuid NOT NULL,
  program text NOT NULL,
  policy_version text NOT NULL,
  next_due_at timestamptz NOT NULL,
  enabled boolean NOT NULL,
  last_trigger_key text,
  UNIQUE(user_id,program),
  UNIQUE(last_trigger_key),
  CHECK(program IS NULL OR octet_length(program)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(last_trigger_key IS NULL OR octet_length(last_trigger_key)<=65536)
);

CREATE TABLE business_details (
  organization_id uuid NOT NULL,
  category text NOT NULL,
  contact text NOT NULL,
  address text NOT NULL,
  hours jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id),
  CHECK(category IS NULL OR octet_length(category)<=65536),
  CHECK(contact IS NULL OR octet_length(contact)<=65536),
  CHECK(address IS NULL OR octet_length(address)<=65536)
);

CREATE TABLE business_media_links (
  organization_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,media_id),
  UNIQUE(organization_id,position)
);

CREATE TABLE reservations_tour_media (
  tour_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tour_id,media_id),
  UNIQUE(tour_id,position)
);

CREATE TABLE communities_media (
  community_id uuid NOT NULL,
  media_id uuid NOT NULL,
  position integer NOT NULL CHECK(position>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(community_id,media_id),
  UNIQUE(community_id,position)
);

CREATE TABLE identity_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE places_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE curation_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE reservations_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE communities_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE moments_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE share_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE messaging_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE guardian_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE flash_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE challenge_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE business_media_retirements (
  media_id uuid NOT NULL,
  user_id uuid NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(media_id)
);

CREATE TABLE retention_authorizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner text NOT NULL,
  target_kind text NOT NULL CHECK(target_kind IN ('curation_revision','capture_receipt','challenge_submission','identity_privilege_audit','operator_audit_event','marketplace_transition')),
  target_id uuid NOT NULL,
  policy_version text NOT NULL,
  approval_reference text NOT NULL,
  approved_at timestamptz NOT NULL,
  eligible_at timestamptz NOT NULL,
  hold_cleared_at timestamptz NOT NULL,
  status text NOT NULL CHECK(status IN ('authorized','executing','completed')),
  executor_xid xid8,
  completed_at timestamptz,
  PRIMARY KEY(id),
  UNIQUE(owner,target_kind,target_id,policy_version),
  CHECK(eligible_at>=approved_at),
  CHECK((status='completed')=(completed_at IS NOT NULL)),
  CHECK(status<>'executing' OR executor_xid IS NOT NULL),
  CHECK(owner IS NULL OR octet_length(owner)<=65536),
  CHECK(target_kind IS NULL OR octet_length(target_kind)<=65536),
  CHECK(policy_version IS NULL OR octet_length(policy_version)<=65536),
  CHECK(approval_reference IS NULL OR octet_length(approval_reference)<=65536),
  CHECK(status IS NULL OR octet_length(status)<=65536)
);
