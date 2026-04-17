// ---------------------------------------------------------------------------
// Shared Supabase client for vanilla-JS tools (dashboard + commentator).
//
// The React/Vite/Next tools ship their own typed client because their
// bundlers inline `import.meta.env.*` / `process.env.NEXT_PUBLIC_*`.
// This module covers the HTML-only tools: it reads `window.THMANYAH_CONFIG`
// (or `window.DASHBOARD_CONFIG`), creates a single client instance, and
// exposes a few narrow helpers that the tools actually need.
//
// Every tool that imports this file gets:
//   - `getClient()`   → lazy-init Supabase client (or null in static mode)
//   - `getUser()`     → cached `auth.user` promise
//   - `callFunction(name, body)` → invokes an edge function with the
//                       user's JWT; throws on !ok
//   - `signIn(email, password)` / `signOut()` helpers
// ---------------------------------------------------------------------------

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

function readConfig() {
  return (
    (typeof window !== 'undefined' && (window.THMANYAH_CONFIG || window.DASHBOARD_CONFIG)) ||
    {}
  );
}

let _client = null;
let _userPromise = null;

export function getClient() {
  if (_client) return _client;
  const cfg = readConfig();
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return null;
  _client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return _client;
}

export async function getUser() {
  const client = getClient();
  if (!client) return null;
  if (!_userPromise) {
    _userPromise = client.auth.getUser().then(r => r.data?.user ?? null);
  }
  return _userPromise;
}

export function onAuthChange(handler) {
  const client = getClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_evt, session) => {
    _userPromise = Promise.resolve(session?.user ?? null);
    handler(session?.user ?? null);
  });
  return () => data?.subscription?.unsubscribe?.();
}

export async function signIn(email, password) {
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  _userPromise = null;
}

export async function signOut() {
  const client = getClient();
  if (!client) return;
  await client.auth.signOut();
  _userPromise = null;
}

// Invoke a Supabase Edge Function with the current user's JWT, using
// fetch() so we can pass binary payloads cleanly. Throws on non-2xx.
export async function callFunction(name, body, { timeoutMs = 180000 } = {}) {
  const cfg = readConfig();
  const client = getClient();
  if (!client) throw new Error('Supabase not configured');
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('not_authenticated');

  const url = `${cfg.SUPABASE_URL}/functions/v1/${name}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': cfg.SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
      body: body == null ? null : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await resp.text();
    let parsed;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
    if (!resp.ok) {
      const err = new Error(parsed?.error || parsed?.detail || `function_error_${resp.status}`);
      err.status = resp.status;
      err.body = parsed;
      throw err;
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}
