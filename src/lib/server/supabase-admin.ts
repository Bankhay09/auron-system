import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_URL } from "@/lib/supabase-public-config";

export function getSupabaseAdmin() {
  const url = SUPABASE_PUBLIC_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase backend nao configurado.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
