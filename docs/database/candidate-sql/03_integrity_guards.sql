-- Candidate technical guards. Owner authorization, policy, input validation and row locks
-- remain necessary; database integrity does not issue permission to perform a command.
CREATE FUNCTION vq_target_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'immutable history: append a new revision or compensating record' USING ERRCODE='23514'; END $$;
CREATE TRIGGER immutable_revision BEFORE UPDATE OR DELETE ON curation_revisions FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_revision_stop BEFORE UPDATE OR DELETE ON curation_revision_stops FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_reward_transaction BEFORE UPDATE OR DELETE ON rewards_transactions FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_reward_entry BEFORE UPDATE OR DELETE ON rewards_entries FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_payment_receipt BEFORE UPDATE OR DELETE ON payments_receipts FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_privilege_audit BEFORE UPDATE OR DELETE ON identity_privilege_audit FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_operator_audit BEFORE UPDATE OR DELETE ON operator_audit_events FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_marketplace_transition BEFORE UPDATE OR DELETE ON marketplace_transitions FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
-- xid8 stores the top-level transaction identity across savepoints. xmin belongs
-- to a subtransaction and would incorrectly reject valid savepoint writes.
CREATE FUNCTION vq_stamp_creation_xid() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.created_in_xid:=pg_current_xact_id(); RETURN NEW; END $$;
CREATE TRIGGER stamp_creation_xid BEFORE INSERT ON curation_revisions FOR EACH ROW EXECUTE FUNCTION vq_stamp_creation_xid();
CREATE TRIGGER stamp_creation_xid BEFORE INSERT ON rewards_transactions FOR EACH ROW EXECUTE FUNCTION vq_stamp_creation_xid();

CREATE FUNCTION vq_target_state_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE transition text;
BEGIN
 IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 transition:=OLD.status||'>'||NEW.status;
 IF NOT transition=ANY(TG_ARGV) THEN RAISE EXCEPTION 'illegal transition % on %',transition,TG_TABLE_NAME USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER state_guard BEFORE UPDATE ON matching_invitations FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>accepted','pending>ignored','pending>cancelled','pending>expired');
CREATE TRIGGER state_guard BEFORE UPDATE ON matching_relationships FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('active>disconnected');
CREATE TRIGGER state_guard BEFORE UPDATE ON matching_runs FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('planned>running','running>completed','running>failed');
CREATE TRIGGER state_guard BEFORE UPDATE ON matching_selections FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('eligible>active','eligible>revoked','eligible>passed','active>passed','active>revoked');
CREATE TRIGGER state_guard BEFORE UPDATE ON share_requests FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>approved','pending>refused','pending>retracted','pending>expired');
CREATE TRIGGER state_guard BEFORE UPDATE ON share_membership_conversions FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>acknowledged','pending>failed','failed>pending');
CREATE TRIGGER state_guard BEFORE UPDATE ON communities_invitations FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>accepted','pending>refused','pending>revoked','pending>expired');
CREATE TRIGGER state_guard BEFORE UPDATE ON curation_trails FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('draft>published','draft>deleted','published>withdrawn','published>deleted','withdrawn>published','withdrawn>deleted');
CREATE TRIGGER state_guard BEFORE UPDATE ON reservations_tours FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('draft>published','published>withdrawn','withdrawn>published');
CREATE TRIGGER state_guard BEFORE UPDATE ON reservations_bookings FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('requested>accepted','requested>rejected','requested>cancelled','requested>expired','accepted>completed','accepted>cancelled');
CREATE TRIGGER state_guard BEFORE UPDATE ON guardian_handshakes FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>verified','pending>rejected');
CREATE TRIGGER state_guard BEFORE UPDATE ON challenge_checks FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('pending>responded','pending>refused','pending>expired');
CREATE TRIGGER state_guard BEFORE UPDATE ON challenge_flashes FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('active>responded','active>denied','active>expired');
CREATE TRIGGER state_guard BEFORE UPDATE ON marketplace_deals FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('requested>accepted','requested>cancelled','accepted>completed','accepted>cancelled');
CREATE TRIGGER state_guard BEFORE UPDATE ON payments_intents FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('created>pending','created>cancelled','pending>confirmed','pending>failed','pending>cancelled');
CREATE TRIGGER state_guard BEFORE UPDATE ON messaging_conversations FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('active>closed');
CREATE TRIGGER state_guard BEFORE UPDATE ON messaging_messages FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('visible>redacted');
CREATE TRIGGER state_guard BEFORE UPDATE ON messaging_polls FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('open>closed');

-- Immutable stops may only be inserted in the transaction creating their revision.
-- This also excludes appending a stop after a booking has pinned that revision.
CREATE FUNCTION vq_revision_stop_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE born_here boolean;
BEGIN
 SELECT created_in_xid=pg_current_xact_id() INTO born_here FROM curation_revisions WHERE id=NEW.revision_id FOR UPDATE;
 IF born_here IS DISTINCT FROM true THEN RAISE EXCEPTION 'revision stops must be created with revision'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER revision_stop_insert BEFORE INSERT ON curation_revision_stops FOR EACH ROW EXECUTE FUNCTION vq_revision_stop_insert();
CREATE FUNCTION vq_revision_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid; n integer; lo integer; hi integer;
BEGIN
 IF TG_TABLE_NAME='curation_revisions' THEN rid:=NEW.id; ELSE rid:=NEW.revision_id; END IF;
 SELECT count(*),min(ordinal),max(ordinal) INTO n,lo,hi FROM curation_revision_stops WHERE revision_id=rid;
 IF n<2 OR n>10 OR lo<>0 OR hi<>n-1 THEN RAISE EXCEPTION 'published revision requires 2-10 contiguous ordered stops'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER revision_complete AFTER INSERT ON curation_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_revision_complete();
CREATE CONSTRAINT TRIGGER revision_complete AFTER INSERT ON curation_revision_stops DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_revision_complete();

CREATE FUNCTION vq_booking_pin() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE offering reservations_tours%ROWTYPE;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.requester_id,NEW.slot_id,NEW.service_kind,NEW.tour_id,NEW.trail_id,NEW.terms_snapshot,NEW.itinerary_revision_id,NEW.offering_version,NEW.party_size)
     IS DISTINCT FROM ROW(OLD.requester_id,OLD.slot_id,OLD.service_kind,OLD.tour_id,OLD.trail_id,OLD.terms_snapshot,OLD.itinerary_revision_id,OLD.offering_version,OLD.party_size)
  THEN RAISE EXCEPTION 'agreed booking identity, itinerary and terms immutable'; END IF;
 ELSIF NEW.service_kind='TOUR' THEN
  SELECT * INTO STRICT offering FROM reservations_tours WHERE id=NEW.tour_id FOR SHARE;
  IF offering.version<>NEW.offering_version OR offering.itinerary_revision_id<>NEW.itinerary_revision_id OR offering.trail_id<>NEW.trail_id THEN RAISE EXCEPTION 'stale offering version or itinerary'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER booking_pin BEFORE INSERT OR UPDATE ON reservations_bookings FOR EACH ROW EXECUTE FUNCTION vq_booking_pin();

CREATE FUNCTION vq_service_context_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cid uuid; k text; n integer;
BEGIN
 IF TG_TABLE_NAME='messaging_conversations' THEN cid:=NEW.id;
 ELSIF TG_OP='DELETE' THEN cid:=OLD.conversation_id; ELSE cid:=NEW.conversation_id; END IF;
 SELECT kind INTO k FROM messaging_conversations WHERE id=cid;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT count(*) INTO n FROM messaging_service_contexts WHERE conversation_id=cid;
 IF (k='SERVICE' AND n<>1) OR (k<>'SERVICE' AND n<>0) THEN RAISE EXCEPTION 'SERVICE requires exactly one concrete inquiry context'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER service_context_complete AFTER INSERT OR UPDATE ON messaging_conversations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_service_context_complete();
CREATE CONSTRAINT TRIGGER service_context_complete AFTER INSERT OR UPDATE OR DELETE ON messaging_service_contexts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_service_context_complete();
CREATE FUNCTION vq_service_inquiry_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE context messaging_service_contexts%ROWTYPE; booking reservations_bookings%ROWTYPE; offering reservations_tours%ROWTYPE; actual_guardian uuid;
BEGIN
 SELECT * INTO STRICT context FROM messaging_service_contexts WHERE conversation_id=NEW.conversation_id FOR SHARE;
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.id,NEW.conversation_id,NEW.trail_id,NEW.itinerary_revision_id,NEW.tour_id,NEW.operation_id) IS DISTINCT FROM ROW(OLD.id,OLD.conversation_id,OLD.trail_id,OLD.itinerary_revision_id,OLD.tour_id,OLD.operation_id) THEN RAISE EXCEPTION 'service inquiry source immutable' USING ERRCODE='23514'; END IF;
  IF OLD.booking_id IS NOT NULL AND NEW.booking_id IS DISTINCT FROM OLD.booking_id THEN RAISE EXCEPTION 'service inquiry booking attachment immutable' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='INSERT' AND NEW.tour_id IS NOT NULL THEN
  SELECT * INTO STRICT offering FROM reservations_tours WHERE id=NEW.tour_id FOR SHARE;
  IF offering.guardian_id<>context.guardian_id OR offering.trail_id IS DISTINCT FROM NEW.trail_id THEN RAISE EXCEPTION 'Tour inquiry source or Guardian mismatch'; END IF;
  -- Unbooked inquiries use the current offering; a booking-first inquiry uses
  -- the immutable agreed booking revision validated below, even after edits.
  IF NEW.booking_id IS NULL AND offering.itinerary_revision_id IS DISTINCT FROM NEW.itinerary_revision_id THEN RAISE EXCEPTION 'unbooked Tour inquiry requires current offering revision'; END IF;
 ELSIF TG_OP='INSERT' AND NEW.itinerary_revision_id IS NOT NULL AND NEW.booking_id IS NULL THEN
  IF NOT EXISTS(SELECT 1 FROM curation_trails WHERE id=NEW.trail_id AND status='published' AND published_revision_id=NEW.itinerary_revision_id) THEN RAISE EXCEPTION 'Trail inquiry requires current published revision'; END IF;
 END IF;
 IF NEW.booking_id IS NOT NULL THEN
  SELECT * INTO STRICT booking FROM reservations_bookings WHERE id=NEW.booking_id FOR SHARE;
  SELECT guardian_id INTO STRICT actual_guardian FROM reservations_slots WHERE id=booking.slot_id;
  IF booking.requester_id<>context.requester_id OR actual_guardian<>context.guardian_id THEN RAISE EXCEPTION 'booking belongs to another inquiry pair'; END IF;
  IF booking.service_kind='TOUR' AND (booking.trail_id IS DISTINCT FROM NEW.trail_id OR booking.itinerary_revision_id IS DISTINCT FROM NEW.itinerary_revision_id OR (NEW.tour_id IS NOT NULL AND booking.tour_id IS DISTINCT FROM NEW.tour_id)) THEN RAISE EXCEPTION 'booking differs from pinned inquiry itinerary'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER service_inquiry_binding BEFORE INSERT OR UPDATE ON messaging_service_inquiries FOR EACH ROW EXECUTE FUNCTION vq_service_inquiry_binding();

CREATE FUNCTION vq_poll_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid uuid; n integer;
BEGIN
 IF TG_TABLE_NAME='messaging_polls' THEN pid:=NEW.id;
 ELSIF TG_OP='DELETE' THEN pid:=OLD.poll_id; ELSE pid:=NEW.poll_id; END IF;
 -- Serialize cardinality checks across transactions. NO KEY UPDATE conflicts
 -- with another cardinality check while remaining compatible with FK KEY SHARE.
 -- The separate count statement obtains a fresh READ COMMITTED snapshot after wait.
 PERFORM 1 FROM messaging_polls WHERE id=pid FOR NO KEY UPDATE;
 IF FOUND THEN
  SELECT count(*) INTO n FROM messaging_poll_options WHERE poll_id=pid;
  IF n<2 OR n>8 THEN RAISE EXCEPTION 'poll requires 2-8 options'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER poll_complete AFTER INSERT OR UPDATE ON messaging_polls DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_poll_complete();
CREATE CONSTRAINT TRIGGER poll_complete AFTER INSERT OR UPDATE OR DELETE ON messaging_poll_options DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_poll_complete();

CREATE FUNCTION vq_capture_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.owner_id,NEW.purpose,NEW.subject_owner,NEW.subject_id,NEW.operation_id,NEW.nonce_hash,NEW.issued_at,NEW.expires_at)
  IS DISTINCT FROM ROW(OLD.owner_id,OLD.purpose,OLD.subject_owner,OLD.subject_id,OLD.operation_id,OLD.nonce_hash,OLD.issued_at,OLD.expires_at)
 THEN RAISE EXCEPTION 'capture binding immutable'; END IF;
 IF OLD.completed_at IS NOT NULL AND ROW(NEW.completed_at,NEW.attestation_level,NEW.device_claim) IS DISTINCT FROM ROW(OLD.completed_at,OLD.attestation_level,OLD.device_claim) THEN RAISE EXCEPTION 'completed capture evidence immutable'; END IF;
 IF OLD.consumed_at IS NOT NULL AND ROW(NEW.consumed_at,NEW.consumed_by_owner,NEW.consumed_by_id) IS DISTINCT FROM ROW(OLD.consumed_at,OLD.consumed_by_owner,OLD.consumed_by_id) THEN RAISE EXCEPTION 'capture consumption immutable'; END IF;
 IF NEW.status='completed' AND OLD.status='issued' THEN
  IF NEW.expires_at<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM media_capture_frames WHERE receipt_id=NEW.id) OR EXISTS(SELECT 1 FROM media_capture_frames f JOIN media_objects m ON m.id=f.media_id WHERE f.receipt_id=NEW.id AND (m.owner_id<>NEW.owner_id OR m.status<>'ready')) THEN RAISE EXCEPTION 'completion requires timely ready actor-owned frames'; END IF;
 END IF;
 IF NEW.status='consumed' AND NEW.consumed_by_owner<>NEW.subject_owner THEN RAISE EXCEPTION 'capture consumer owner differs from binding'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER capture_binding BEFORE UPDATE ON media_capture_receipts FOR EACH ROW EXECUTE FUNCTION vq_capture_binding_guard();
CREATE TRIGGER state_guard BEFORE UPDATE ON media_capture_receipts FOR EACH ROW EXECUTE FUNCTION vq_target_state_guard('issued>completed','issued>expired','issued>failed','completed>consumed','completed>expired');
CREATE FUNCTION vq_capture_frames_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE receipt media_capture_receipts%ROWTYPE; mid uuid; rid uuid;
BEGIN
 IF TG_OP='DELETE' THEN rid:=OLD.receipt_id; mid:=OLD.media_id; ELSE rid:=NEW.receipt_id; mid:=NEW.media_id; END IF;
 SELECT * INTO STRICT receipt FROM media_capture_receipts WHERE id=rid FOR UPDATE;
 IF receipt.status<>'issued' THEN RAISE EXCEPTION 'capture frames frozen after completion'; END IF;
 IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'replace issued frame by explicit delete and insert'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM media_objects WHERE id=mid AND owner_id=receipt.owner_id AND status='ready') THEN RAISE EXCEPTION 'frame must be ready and actor-owned'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER capture_frames BEFORE INSERT OR UPDATE OR DELETE ON media_capture_frames FOR EACH ROW EXECUTE FUNCTION vq_capture_frames_guard();
CREATE FUNCTION vq_challenge_submit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE receipt media_capture_receipts%ROWTYPE; expected_actor uuid; deadline timestamptz; expected_purpose text; target uuid; current_status text;
BEGIN
 -- Lock target before receipt in every owner command; this order prevents reciprocal waits.
 IF NEW.check_id IS NOT NULL THEN
  SELECT recipient_id,deadline_at,status INTO STRICT expected_actor,deadline,current_status FROM challenge_checks WHERE id=NEW.check_id FOR UPDATE;
  expected_purpose:='check'; target:=NEW.check_id;
 ELSE
  SELECT user_id,deadline_at,status INTO STRICT expected_actor,deadline,current_status FROM challenge_flashes WHERE id=NEW.flash_id FOR UPDATE;
  expected_purpose:='flash'; target:=NEW.flash_id;
 END IF;
 IF expected_actor<>NEW.actor_id OR current_status NOT IN ('pending','active') OR clock_timestamp()>deadline THEN RAISE EXCEPTION 'challenge unavailable or actor ineligible'; END IF;
 SELECT * INTO STRICT receipt FROM media_capture_receipts WHERE id=NEW.capture_receipt_id FOR UPDATE;
 IF receipt.owner_id<>NEW.actor_id OR receipt.purpose<>expected_purpose OR receipt.subject_owner<>'photo-challenges' OR receipt.subject_id<>target OR receipt.operation_id<>NEW.operation_id OR receipt.status<>'completed' OR receipt.consumed_at IS NOT NULL OR receipt.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'capture actor, target, purpose or operation mismatch'; END IF;
 IF NOT EXISTS(SELECT 1 FROM media_capture_frames WHERE receipt_id=receipt.id) OR EXISTS(SELECT 1 FROM media_capture_frames f JOIN media_objects m ON m.id=f.media_id WHERE f.receipt_id=receipt.id AND (m.owner_id<>NEW.actor_id OR m.status<>'ready')) THEN RAISE EXCEPTION 'capture frames unavailable'; END IF;
 NEW.submitted_at:=clock_timestamp();
 IF NEW.submitted_at>deadline THEN RAISE EXCEPTION 'challenge deadline elapsed while acquiring proof'; END IF;
 UPDATE media_capture_receipts SET status='consumed',consumed_at=NEW.submitted_at,consumed_by_owner='photo-challenges',consumed_by_id=NEW.id,version=version+1 WHERE id=receipt.id;
 IF NEW.check_id IS NOT NULL THEN UPDATE challenge_checks SET status='responded',decided_at=NEW.submitted_at,version=version+1 WHERE id=target;
 ELSE UPDATE challenge_flashes SET status='responded',decided_at=NEW.submitted_at,version=version+1 WHERE id=target; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER challenge_submit BEFORE INSERT ON challenge_submissions FOR EACH ROW EXECUTE FUNCTION vq_challenge_submit();
CREATE TRIGGER immutable_challenge_submission BEFORE UPDATE ON challenge_submissions FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE FUNCTION vq_challenge_frames_match() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid; receipt uuid;
BEGIN
 IF TG_TABLE_NAME='challenge_submissions' THEN sid:=NEW.id;
 ELSIF TG_OP='DELETE' THEN sid:=OLD.submission_id; ELSE sid:=NEW.submission_id; END IF;
 SELECT capture_receipt_id INTO receipt FROM challenge_submissions WHERE id=sid;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF EXISTS((SELECT media_id,camera_role FROM media_capture_frames WHERE receipt_id=receipt EXCEPT SELECT media_id,camera_role FROM challenge_media_links WHERE submission_id=sid)
 UNION ALL (SELECT media_id,camera_role FROM challenge_media_links WHERE submission_id=sid EXCEPT SELECT media_id,camera_role FROM media_capture_frames WHERE receipt_id=receipt)) THEN RAISE EXCEPTION 'submission frames differ from consumed receipt'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER challenge_frames_match AFTER INSERT ON challenge_submissions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_challenge_frames_match();
CREATE CONSTRAINT TRIGGER challenge_frames_match AFTER INSERT OR UPDATE OR DELETE ON challenge_media_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_challenge_frames_match();

-- Journal entries cannot be appended to an old committed transaction.
CREATE FUNCTION vq_reward_entry_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE born_here boolean;
BEGIN
 SELECT created_in_xid=pg_current_xact_id() INTO born_here FROM rewards_transactions WHERE id=NEW.transaction_id FOR UPDATE;
 IF born_here IS DISTINCT FROM true THEN RAISE EXCEPTION 'journal entries require same transaction as journal header'; END IF;
 PERFORM 1 FROM rewards_accounts WHERE id=NEW.account_id FOR UPDATE;
 RETURN NEW;
END $$;
CREATE TRIGGER reward_entry_insert BEFORE INSERT ON rewards_entries FOR EACH ROW EXECUTE FUNCTION vq_reward_entry_insert();
CREATE FUNCTION vq_reward_balance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tid uuid;
BEGIN
 IF TG_TABLE_NAME='rewards_transactions' THEN tid:=NEW.id; ELSE tid:=NEW.transaction_id; END IF;
 IF NOT EXISTS(SELECT 1 FROM rewards_entries WHERE transaction_id=tid) OR EXISTS(
 SELECT a.asset_id FROM rewards_entries e JOIN rewards_accounts a ON a.id=e.account_id WHERE e.transaction_id=tid GROUP BY a.asset_id HAVING sum(e.amount)<>0 OR count(*)<2)
 THEN RAISE EXCEPTION 'journal must balance per asset with at least two accounts' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER reward_balance AFTER INSERT ON rewards_transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_reward_balance();
CREATE CONSTRAINT TRIGGER reward_balance AFTER INSERT ON rewards_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_reward_balance();

CREATE FUNCTION vq_challenge_clock_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.opened_at,NEW.deadline_at) IS DISTINCT FROM ROW(OLD.opened_at,OLD.deadline_at) THEN RAISE EXCEPTION 'challenge deadline immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER challenge_clock BEFORE UPDATE ON challenge_checks FOR EACH ROW EXECUTE FUNCTION vq_challenge_clock_guard();
CREATE TRIGGER challenge_clock BEFORE UPDATE ON challenge_flashes FOR EACH ROW EXECUTE FUNCTION vq_challenge_clock_guard();
CREATE FUNCTION vq_account_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.user_id,NEW.system_account,NEW.asset_id) IS DISTINCT FROM ROW(OLD.user_id,OLD.system_account,OLD.asset_id) THEN RAISE EXCEPTION 'ledger account identity immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ledger_account_identity BEFORE UPDATE ON rewards_accounts FOR EACH ROW EXECUTE FUNCTION vq_account_identity_guard();
CREATE TRIGGER immutable_reward_claim BEFORE UPDATE OR DELETE ON rewards_claims FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_media_variant BEFORE UPDATE ON media_variants FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE FUNCTION vq_lineage_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('vq_curation_lineage',0));
 IF EXISTS(WITH RECURSIVE ancestors(id) AS (
  SELECT NEW.parent_id UNION SELECT l.parent_id FROM curation_lineage l JOIN ancestors a ON l.child_id=a.id
 ) SELECT 1 FROM ancestors WHERE id=NEW.child_id) THEN RAISE EXCEPTION 'trail lineage cycle'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER lineage_guard BEFORE INSERT ON curation_lineage FOR EACH ROW EXECUTE FUNCTION vq_lineage_guard();
CREATE TRIGGER immutable_lineage BEFORE UPDATE ON curation_lineage FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE FUNCTION vq_community_owner_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cid uuid; oid uuid; n integer;
BEGIN
 IF TG_TABLE_NAME='communities_entries' THEN cid:=NEW.id;
 ELSIF TG_OP='DELETE' THEN cid:=OLD.community_id; ELSE cid:=NEW.community_id; END IF;
 SELECT owner_id INTO oid FROM communities_entries WHERE id=cid FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT count(*) INTO n FROM communities_memberships WHERE community_id=cid AND role='owner' AND status='active';
 IF n<>1 OR NOT EXISTS(SELECT 1 FROM communities_memberships WHERE community_id=cid AND user_id=oid AND role='owner' AND status='active') THEN RAISE EXCEPTION 'community requires one matching active owner membership'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER community_owner_complete AFTER INSERT OR UPDATE ON communities_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_community_owner_complete();
CREATE CONSTRAINT TRIGGER community_owner_complete AFTER INSERT OR UPDATE OR DELETE ON communities_memberships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_community_owner_complete();
CREATE UNIQUE INDEX community_one_owner ON communities_memberships(community_id) WHERE role='owner' AND status='active';

CREATE FUNCTION vq_matching_origin_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE lo uuid; hi uuid; program text; invitation_status text;
BEGIN
 IF NEW.origin='MANUAL' THEN
  SELECT least(sender_id,recipient_id),greatest(sender_id,recipient_id),status INTO STRICT lo,hi,invitation_status FROM matching_invitations WHERE id=NEW.source_invitation_id FOR UPDATE;
  IF invitation_status<>'accepted' THEN RAISE EXCEPTION 'manual relationship requires accepted invitation'; END IF;
 ELSE
  SELECT s.user_low,s.user_high,r.program INTO STRICT lo,hi,program FROM matching_selections s JOIN matching_runs r ON r.id=s.run_id WHERE s.id=NEW.selection_id FOR UPDATE OF s;
  IF program<>NEW.origin THEN RAISE EXCEPTION 'selection program mismatch'; END IF;
 END IF;
 IF ROW(lo,hi) IS DISTINCT FROM ROW(NEW.user_low,NEW.user_high) THEN RAISE EXCEPTION 'relationship origin pair mismatch'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER matching_origin_guard AFTER INSERT OR UPDATE ON matching_relationships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION vq_matching_origin_guard();
CREATE FUNCTION vq_explanation_actor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM matching_selections WHERE id=NEW.selection_id AND NEW.viewer_id IN (user_low,user_high)) THEN RAISE EXCEPTION 'explanation viewer outside selection'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER explanation_actor BEFORE INSERT OR UPDATE ON matching_explanations FOR EACH ROW EXECUTE FUNCTION vq_explanation_actor();

CREATE FUNCTION vq_guardian_review_eligibility() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE encounter guardian_handshakes%ROWTYPE;
BEGIN
 SELECT * INTO STRICT encounter FROM guardian_handshakes WHERE id=NEW.handshake_id FOR UPDATE;
 IF encounter.status<>'verified' OR encounter.visitor_id<>NEW.reviewer_id OR encounter.guardian_id=NEW.reviewer_id OR (encounter.expires_at IS NOT NULL AND encounter.expires_at<=clock_timestamp()) THEN RAISE EXCEPTION 'review requires eligible verified encounter'; END IF;
 IF NOT EXISTS(SELECT 1 FROM identity_verification_cases WHERE id=NEW.verified_case_id AND user_id=NEW.reviewer_id AND status='verified' AND (expires_at IS NULL OR expires_at>clock_timestamp())) THEN RAISE EXCEPTION 'reviewer verification unavailable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guardian_review_eligibility BEFORE INSERT ON guardian_reviews FOR EACH ROW EXECUTE FUNCTION vq_guardian_review_eligibility();

-- The stricter approved per-policy clock/role/capacity/amount guards belong in owner
-- commands, supplied through published owner ports and a composition-owned UoW.
-- They are not guessed by these integrity triggers.

-- Child identities cannot move between aggregates. This prevents UPDATE from
-- invalidating an OLD parent that a deferred NEW-parent check would not revisit.
CREATE FUNCTION vq_parent_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE column_name text;
BEGIN
 FOREACH column_name IN ARRAY TG_ARGV LOOP
  IF (to_jsonb(NEW)->column_name) IS DISTINCT FROM (to_jsonb(OLD)->column_name) THEN RAISE EXCEPTION 'aggregate child identity % immutable',column_name USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_poll_options FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('poll_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_poll_votes FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('poll_id','option_id','user_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_polls FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('message_id','creator_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_service_contexts FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('conversation_id','guardian_id','requester_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON communities_memberships FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('community_id','user_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON challenge_media_links FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('submission_id','media_id','camera_role');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_conversations FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('kind','community_id','relationship_id','deal_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_messages FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('conversation_id','sender_id','service_inquiry_id','sequence','client_nonce','expires_at','retention_policy_version');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_participants FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('conversation_id','user_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON messaging_read_cursors FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('conversation_id','user_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON guardian_selfies FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('guardian_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON matching_relationships FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('user_low','user_high','origin','source_invitation_id','selection_id','activated_at');
CREATE TRIGGER parent_identity BEFORE UPDATE ON matching_invitations FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('sender_id','recipient_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON matching_explanations FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('selection_id','viewer_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON reservations_tours FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('trail_id','guardian_id');
CREATE TRIGGER parent_identity BEFORE UPDATE ON reservations_slots FOR EACH ROW EXECUTE FUNCTION vq_parent_identity_guard('tour_id','guardian_id','service_kind');
