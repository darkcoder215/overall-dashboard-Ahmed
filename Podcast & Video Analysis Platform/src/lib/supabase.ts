/**
 * Supabase client for the Podcast & Video Analysis Platform.
 *
 * The unified Thmanyah Supabase project holds a `podcast_video` schema
 * (see `Overall-Dashboard/supabase/migrations/`) with `podcasts`,
 * `scenes`, `scene_embeddings` and `pipeline_jobs` tables. This client
 * is used to hydrate the in-memory store on load so that podcasts
 * created/edited from another session are visible in every deploy.
 *
 * The Next.js static export disables uploads (see staticApiShim.ts
 * POST /api/podcasts → 503), so in production this client is mostly
 * read-only: it pulls rows into the store and the existing demo data
 * serves as a fallback when the DB is empty.
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
