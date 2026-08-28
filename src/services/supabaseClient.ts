import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const isSupabaseConfigured = (): boolean =>
  Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("your-project") &&
    !SUPABASE_ANON_KEY.includes("your-supabase")
  );

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
