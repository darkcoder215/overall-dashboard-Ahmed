/**
 * Supabase client for the Feedback Analysis Platform.
 *
 * The unified Thmanyah Supabase project holds a `feedback` schema
 * (see `Overall-Dashboard/supabase/migrations/`) with the employee /
 * evaluation / review / leader tables. This client lets the tool
 * hydrate that data from Supabase in addition to the static CSVs in
 * `/public/data/`, so an admin can push updates without rebuilding.
 *
 * Env vars:
 *   NEXT_PUBLIC_SUPABASE_URL         unified project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY    publishable (anon) key
 * Both are set by `Overall-Dashboard/build.sh`; the hard-coded fallbacks
 * match the Thmanyah project so the tool still works if env is missing.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://hbnvbfcwrfanpayxulih.supabase.co';
const FALLBACK_ANON_KEY = 'sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

const effectiveUrl =
  supabaseUrl && supabaseUrl.length > 0 ? supabaseUrl : FALLBACK_URL;
const effectiveKey =
  supabaseAnonKey && supabaseAnonKey.length > 0
    ? supabaseAnonKey
    : FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(effectiveUrl && effectiveKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
