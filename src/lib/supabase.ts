import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase environment variables (Expo):
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Do not throw here so the existing local prototype can run without Supabase configured.
  // Consumers should handle missing configuration at runtime.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars not set. Supabase client initialized with empty values.');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
