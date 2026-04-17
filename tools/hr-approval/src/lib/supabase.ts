import { createClient, SupabaseClient } from "@supabase/supabase-js";

// These defaults match the unified Thmanyah Supabase project. Set
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in the
// build environment (the Overall-Dashboard build.sh does this
// automatically) to override.
const FALLBACK_URL = "https://hbnvbfcwrfanpayxulih.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Guard against empty strings (someone sets the env var to "") and
// fall through to the fallback so the tool always has a working
// client.
const effectiveUrl = supabaseUrl && supabaseUrl.length > 0 ? supabaseUrl : FALLBACK_URL;
const effectiveKey =
  supabaseAnonKey && supabaseAnonKey.length > 0 ? supabaseAnonKey : FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(effectiveUrl && effectiveKey);

// `persistSession: true` is intentional — the HR tool is hosted under the
// same origin as the Overall Dashboard, so it reads the dashboard's
// Supabase session out of shared localStorage and forwards it on edge
// function calls.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
