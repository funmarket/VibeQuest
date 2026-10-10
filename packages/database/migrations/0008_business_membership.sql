CREATE TABLE identity_privileges (
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  privilege text NOT NULL CHECK(privilege IN ('business.review')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,privilege)
);
CREATE TABLE business_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES identity_users(id),
  name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 120),
  description text NOT NULL CHECK(length(description)<=1000),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_organizations_owner_idx ON business_organizations(owner_id);
CREATE TABLE business_memberships (
  organization_id uuid NOT NULL REFERENCES business_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK(role IN ('owner','member')),
  status text NOT NULL CHECK(status IN ('invited','active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,user_id),
  CHECK(role<>'owner' OR status='active')
);
CREATE UNIQUE INDEX business_memberships_owner_idx ON business_memberships(organization_id) WHERE role='owner';
CREATE INDEX business_memberships_user_idx ON business_memberships(user_id);
CREATE TABLE business_reviews (
  organization_id uuid PRIMARY KEY REFERENCES business_organizations(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES identity_users(id),
  decision text NOT NULL CHECK(decision IN ('approved','rejected')),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
