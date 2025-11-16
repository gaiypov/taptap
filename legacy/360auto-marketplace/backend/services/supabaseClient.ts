// backend/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL) {
  throw new Error('Missing Supabase URL. Set SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) in environment.');
}

if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in environment.');
}

export const serviceSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default serviceSupabase;
