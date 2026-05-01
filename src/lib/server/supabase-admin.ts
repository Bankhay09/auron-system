import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_URL } from "@/lib/supabase-public-config";

export class SupabaseAdminConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Configuracao do backend Supabase incompleta: ${missing.join(", ")} ausente.`);
    this.name = "SupabaseAdminConfigError";
  }
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_PUBLIC_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new SupabaseAdminConfigError(missing);

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
