-- Definition only. No actor is granted this permission by this migration.
ALTER TABLE identity_privileges DROP CONSTRAINT identity_privileges_privilege_check;
ALTER TABLE identity_privileges ADD CONSTRAINT identity_privileges_privilege_check CHECK(privilege IN ('business.review','content.moderate'));
