import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL, isSupabasePublicConfigured } from "@/lib/supabase-public-config";

export { isSupabasePublicConfigured };

export const supabase = isSupabasePublicConfigured
  ? createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_ANON_KEY)
  : null;
