import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { hashPassword } from "@/lib/server/password";
import { isEmail, validatePassword } from "@/lib/server/validation";
import { isResetCodeExpired, resetCodeHash } from "@/lib/server/reset-codes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const password = String(body.password || "");
    if (!isEmail(email) || !/^\d{6}$/.test(code)) return error("Codigo ou email invalido.", 400);
    if (!validatePassword(password)) return error("A senha precisa ter pelo menos 8 caracteres.", 400);

    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (userError) return supabaseError("buscar usuario", userError);
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

    if (resetError) return supabaseError("validar codigo", resetError);
    if (!reset || isResetCodeExpired(reset.expires_at)) return error("Codigo invalido ou expirado.", 400);

    const { error: updateUserError } = await supabase.from("users").update({ password_hash: hashPassword(password), updated_at: new Date().toISOString() }).eq("id", user.id);
    if (updateUserError) return supabaseError("atualizar senha", updateUserError);
    const { error: updateCodeError } = await supabase.from("password_reset_codes").update({ used: true, used_at: new Date().toISOString() }).eq("id", reset.id);
    if (updateCodeError) return supabaseError("invalidar codigo", updateCodeError);
    return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso." });
  } catch (caught) {
    console.error("[api/auth/reset-password] erro inesperado", caught);
    const message = caught instanceof Error ? caught.message : "Nao foi possivel redefinir a senha.";
    return error(`Nao foi possivel redefinir a senha: ${message}`, 500);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

function supabaseError(action: string, caught: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[api/auth/reset-password] erro Supabase ao ${action}`, caught);
  const parts = [caught.message, caught.code && `code=${caught.code}`, caught.details && `details=${caught.details}`, caught.hint && `hint=${caught.hint}`].filter(Boolean);
  return error(`Erro Supabase ao ${action}: ${parts.join(" | ") || "sem detalhes"}`, 500);
}
