-- Proposed restricted retention mechanism. No roles or production grants are created.
-- Function/table owner must be a dedicated NOLOGIN retention role at authorized
-- infrastructure provisioning. Application roles get no table rights or EXECUTE.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON public.retention_authorizations FROM PUBLIC;
CREATE FUNCTION vq_retention_allowed(table_name text, target uuid) RETURNS boolean
LANGUAGE plpgsql VOLATILE SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE expected_owner name; kind text;
BEGIN
 SELECT pg_get_userbyid(proowner) INTO expected_owner FROM pg_proc WHERE oid='public.vq_purge_retained(uuid)'::regprocedure;
 IF current_user<>expected_owner THEN RETURN false; END IF;
 kind:=CASE table_name
  WHEN 'curation_revisions' THEN 'curation_revision' WHEN 'curation_revision_stops' THEN 'curation_revision'
  WHEN 'media_capture_receipts' THEN 'capture_receipt' WHEN 'media_capture_frames' THEN 'capture_receipt'
  WHEN 'challenge_submissions' THEN 'challenge_submission' WHEN 'challenge_media_links' THEN 'challenge_submission'
  WHEN 'identity_privilege_audit' THEN 'identity_privilege_audit' WHEN 'operator_audit_events' THEN 'operator_audit_event'
  WHEN 'marketplace_transitions' THEN 'marketplace_transition' END;
 RETURN EXISTS(SELECT 1 FROM public.retention_authorizations WHERE target_kind=kind AND target_id=target
  AND status='executing' AND executor_xid=pg_current_xact_id() AND eligible_at<=statement_timestamp());
END $$;
REVOKE ALL ON FUNCTION vq_retention_allowed(text,uuid) FROM PUBLIC;

CREATE FUNCTION vq_authorize_retention(owner_name text,kind text,target uuid,policy text,approval text,approved timestamptz,eligible timestamptz,hold_clear timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE authorization uuid;
BEGIN
 IF policy IS NULL OR btrim(policy)='' OR approval IS NULL OR btrim(approval)='' OR approved>clock_timestamp() OR hold_clear>clock_timestamp() OR kind NOT IN ('curation_revision','capture_receipt','challenge_submission','identity_privilege_audit','operator_audit_event','marketplace_transition') THEN RAISE EXCEPTION 'invalid policy-approved retention authorization'; END IF;
 IF owner_name IS DISTINCT FROM (CASE kind WHEN 'curation_revision' THEN 'curation' WHEN 'capture_receipt' THEN 'media' WHEN 'challenge_submission' THEN 'photo-challenges' WHEN 'identity_privilege_audit' THEN 'identity' WHEN 'operator_audit_event' THEN 'identity' WHEN 'marketplace_transition' THEN 'marketplace' END) THEN RAISE EXCEPTION 'retention owner mismatch'; END IF;
 INSERT INTO public.retention_authorizations(owner,target_kind,target_id,policy_version,approval_reference,approved_at,eligible_at,hold_cleared_at,status)
 VALUES(owner_name,kind,target,policy,approval,approved,eligible,hold_clear,'authorized') RETURNING id INTO authorization;
 RETURN authorization;
END $$;
REVOKE ALL ON FUNCTION vq_authorize_retention(text,text,uuid,text,text,timestamptz,timestamptz,timestamptz) FROM PUBLIC;

CREATE FUNCTION vq_purge_retained(authorization_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE a public.retention_authorizations%ROWTYPE;
BEGIN
 SELECT * INTO STRICT a FROM public.retention_authorizations WHERE id=authorization_id FOR UPDATE;
 IF a.status='completed' THEN RETURN; END IF;
 IF a.status<>'authorized' OR a.eligible_at>clock_timestamp() OR a.hold_cleared_at>clock_timestamp() THEN RAISE EXCEPTION 'retention authorization unavailable or not due'; END IF;
 UPDATE public.retention_authorizations SET status='executing',executor_xid=pg_current_xact_id() WHERE id=a.id;
 CASE a.target_kind
 WHEN 'curation_revision' THEN
  DELETE FROM public.curation_revision_stops WHERE revision_id=a.target_id;
  DELETE FROM public.curation_revisions WHERE id=a.target_id;
 WHEN 'capture_receipt' THEN
  DELETE FROM public.media_capture_frames WHERE receipt_id=a.target_id;
  DELETE FROM public.media_capture_receipts WHERE id=a.target_id;
 WHEN 'challenge_submission' THEN
  DELETE FROM public.challenge_media_links WHERE submission_id=a.target_id;
  DELETE FROM public.challenge_submissions WHERE id=a.target_id;
 WHEN 'identity_privilege_audit' THEN DELETE FROM public.identity_privilege_audit WHERE id=a.target_id;
 WHEN 'operator_audit_event' THEN DELETE FROM public.operator_audit_events WHERE id=a.target_id;
 WHEN 'marketplace_transition' THEN DELETE FROM public.marketplace_transitions WHERE id=a.target_id;
 ELSE RAISE EXCEPTION 'unsupported retained fact';
 END CASE;
 -- Deferred constraints must also be checked by caller before reporting success.
 -- RESTRICT references already fail at statement time and roll back deletion plus authorization.
 UPDATE public.retention_authorizations SET status='completed',completed_at=clock_timestamp() WHERE id=a.id;
END $$;
REVOKE ALL ON FUNCTION vq_purge_retained(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION vq_target_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 IF TG_OP='DELETE' THEN
  target:=CASE TG_TABLE_NAME WHEN 'curation_revision_stops' THEN (to_jsonb(OLD)->>'revision_id')::uuid WHEN 'rewards_entries' THEN (to_jsonb(OLD)->>'transaction_id')::uuid ELSE (to_jsonb(OLD)->>'id')::uuid END;
  IF public.vq_retention_allowed(TG_TABLE_NAME,target) THEN RETURN OLD; END IF;
 END IF;
 RAISE EXCEPTION 'immutable history: append a new revision or compensating record' USING ERRCODE='23514';
END $$;
CREATE OR REPLACE FUNCTION vq_capture_frames_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE receipt public.media_capture_receipts%ROWTYPE; mid uuid; rid uuid;
BEGIN
 IF TG_OP='DELETE' THEN rid:=OLD.receipt_id; mid:=OLD.media_id; ELSE rid:=NEW.receipt_id; mid:=NEW.media_id; END IF;
 IF TG_OP='DELETE' AND public.vq_retention_allowed('media_capture_frames',rid) THEN RETURN OLD; END IF;
 SELECT * INTO STRICT receipt FROM public.media_capture_receipts WHERE id=rid FOR UPDATE;
 IF receipt.status<>'issued' THEN RAISE EXCEPTION 'capture frames frozen after completion'; END IF;
 IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'replace issued frame by explicit delete and insert'; END IF;
 IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM public.media_objects WHERE id=mid AND owner_id=receipt.owner_id AND status='ready') THEN RAISE EXCEPTION 'frame must be ready and actor-owned'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER immutable_capture_delete BEFORE DELETE ON media_capture_receipts FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
CREATE TRIGGER immutable_submission_delete BEFORE DELETE ON challenge_submissions FOR EACH ROW EXECUTE FUNCTION vq_target_immutable();
REVOKE ALL ON FUNCTION vq_target_immutable() FROM PUBLIC;
REVOKE ALL ON FUNCTION vq_capture_frames_guard() FROM PUBLIC;
