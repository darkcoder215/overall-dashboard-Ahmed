import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hbnvbfcwrfanpayxulih.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_P_AoE0x-HsqrJTarwZOT7Q_0UE2trZv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
