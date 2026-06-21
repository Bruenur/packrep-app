-- Minimal schema for PackRep Phase 1

-- Enable pgcrypto for uuid generation (Supabase typically allows this)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (app-level profile data)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  profile jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- Leads table (generic payload for now)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);

-- Migration tracking for AsyncStorage keys/items
CREATE TABLE IF NOT EXISTS migrations_asyncstorage (
  key text PRIMARY KEY,
  migrated_at timestamptz DEFAULT now(),
  meta jsonb
);

-- Builders table (mirrors local Builder type, with payload fallback)
CREATE TABLE IF NOT EXISTS builders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  community_name text,
  min_price numeric,
  max_price numeric,
  min_beds int,
  max_beds int,
  baths_min int,
  sqft_min int,
  sqft_max int,
  schools jsonb,
  utility_type text,
  tax_rate numeric,
  hoa text,
  quick_appeal text,
  address text,
  sales_counselor_name text,
  sales_counselor_email text,
  sales_counselor_phone text,
  color_key text,
  sponsored boolean DEFAULT false,
  location_lat double precision,
  location_lon double precision,
  active boolean DEFAULT true,
  notes text,
  hidden boolean DEFAULT false,
  engagement text,
  accepts_open_house_requests boolean DEFAULT true,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_builders_location ON builders (location_lat, location_lon);
CREATE INDEX IF NOT EXISTS idx_builders_created_at ON builders (created_at);

-- Used homes table
CREATE TABLE IF NOT EXISTS used_homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text,
  price numeric,
  beds int,
  baths int,
  sqft int,
  year_built int,
  address text,
  city text,
  listing_agent text,
  link text,
  photo_url text,
  notes text,
  latitude double precision,
  longitude double precision,
  active boolean DEFAULT true,
  hidden boolean DEFAULT false,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_used_homes_location ON used_homes (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_used_homes_created_at ON used_homes (created_at);
CREATE INDEX IF NOT EXISTS idx_used_homes_owner ON used_homes (owner_id);

-- Favorite pins (per-user)
CREATE TABLE IF NOT EXISTS favorite_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text,
  subtitle text,
  category text,
  latitude double precision,
  longitude double precision,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_favorite_pins_owner ON favorite_pins (owner_id);
CREATE INDEX IF NOT EXISTS idx_favorite_pins_category ON favorite_pins (category);
CREATE INDEX IF NOT EXISTS idx_favorite_pins_location ON favorite_pins (latitude, longitude);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  at timestamptz,
  date text,
  time text,
  builder_id uuid REFERENCES builders(id) ON DELETE SET NULL,
  builder_name text,
  community_name text,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  lead_name text,
  notes text,
  payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_owner ON appointments (owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_at ON appointments (at);
CREATE INDEX IF NOT EXISTS idx_appointments_builder ON appointments (builder_id);

-- Pin preferences (per-user)
CREATE TABLE IF NOT EXISTS pin_prefs (
  owner_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prefs jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Wall posts
CREATE TABLE IF NOT EXISTS wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name text,
  author_brokerage text,
  category text,
  role text,
  title text,
  body text,
  payload jsonb
);
CREATE INDEX IF NOT EXISTS idx_wall_posts_created_at ON wall_posts (created_at);
CREATE INDEX IF NOT EXISTS idx_wall_posts_category ON wall_posts (category);

-- Open house requests
CREATE TABLE IF NOT EXISTS open_house_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  requester_id uuid REFERENCES users(id) ON DELETE SET NULL,
  builder_id uuid REFERENCES builders(id) ON DELETE SET NULL,
  builder_name text,
  community_name text,
  requested_date date,
  requested_time text,
  notes text,
  expected_traffic text,
  realtor_name text,
  brokerage text,
  email text,
  phone text,
  status text,
  payload jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_open_house_builder ON open_house_requests (builder_id);
CREATE INDEX IF NOT EXISTS idx_open_house_status ON open_house_requests (status);
CREATE INDEX IF NOT EXISTS idx_open_house_created_at ON open_house_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_open_house_requested_date ON open_house_requests (requested_date);
CREATE INDEX IF NOT EXISTS idx_open_house_requester ON open_house_requests (requester_id);

