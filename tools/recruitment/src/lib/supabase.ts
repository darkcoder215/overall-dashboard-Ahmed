import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hbnvbfcwrfanpayxulih.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibnZiZmN3cmZhbnBheXh1bGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTYwMjYsImV4cCI6MjA5MTQ5MjAyNn0.lTrlx_YfBn8-4ii19Rets8sbi59o2yYAJQ31WB_w6Rw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;
