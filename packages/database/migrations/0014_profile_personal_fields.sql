-- Owner-only Profile data. Public readers retain their explicit four-column projection.
ALTER TABLE profile_profiles
  ADD COLUMN interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN location text NOT NULL DEFAULT '',
  ADD COLUMN contact_method text NOT NULL DEFAULT 'telegram' CHECK (contact_method IN ('telegram','x','email')),
  ADD COLUMN contact_email text NOT NULL DEFAULT '',
  ADD COLUMN phone_number text NOT NULL DEFAULT '',
  ADD COLUMN x_handle text NOT NULL DEFAULT '',
  ADD COLUMN telegram_handle text NOT NULL DEFAULT '',
  ADD COLUMN cozy_diary boolean NOT NULL DEFAULT false;
