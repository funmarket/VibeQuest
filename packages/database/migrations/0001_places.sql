CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  category text NOT NULL CHECK (length(trim(category)) BETWEEN 1 AND 60),
  location geometry(Point,4326) NOT NULL CHECK (ST_X(location) BETWEEN -180 AND 180 AND ST_Y(location) BETWEEN -90 AND 90),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now() CHECK (updated_at >= created_at)
);
CREATE INDEX places_published_location_idx ON places USING gist(location) WHERE publication_status = 'published';
CREATE FUNCTION places_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END $$;
CREATE TRIGGER places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION places_touch_updated_at();
