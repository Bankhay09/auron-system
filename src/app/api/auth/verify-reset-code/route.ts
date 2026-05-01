import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isEmail } from "@/lib/server/validation";
import { isResetCodeExpired, resetCodeHash } from "@/lib/server/reset-codes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    if (!isEmail(email) || !/^\d{6}$/.test(code)) return error("Codigo invalido ou expirado.", 400);

    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (userError) {
      console.error("[api/auth/verify-reset-code] erro ao buscar usuario", userError);
      return error(`Erro Supabase ao buscar usuario: ${userError.message}`, 500);
    }
    if (!user) return error("Codigo invalido ou expirado.", 400);

    const { data: reset, error: resetError } = await supabase
      .from("password_reset_codes")
      .select("id, expires_at, used, used_at")
      .eq("user_id", user.id)
      .eq("code_hash", resetCodeHash(code))
      .eq("used", false)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resetError) {
      console.error("[api/auth/verify-reset-code] erro ao validar codigo", resetError);
      return error(`Erro Supabase ao validar codigo: ${resetError.message}`, 500);
    }

    if (!reset || isResetCodeExpired(reset.expires_at)) return error("Codigo invalido ou expirado.", 400);
    return NextResponse.json({ ok: true, message: "Codigo validado." });
  } catch (caught) {
    console.error("[api/auth/verify-reset-code] erro inesperado", caught);
    return error("Nao foi possivel validar o codigo.", 500);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
