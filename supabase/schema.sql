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

-- Migration tracking for AsyncStorage keys/items
CREATE TABLE IF NOT EXISTS migrations_asyncstorage (
  key text PRIMARY KEY,
  migrated_at timestamptz DEFAULT now(),
  meta jsonb
);
