import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { hashCode, hashPassword } from "@/lib/server/password";
import { isEmail, validatePassword } from "@/lib/server/validation";
import { nowIso, readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const password = String(body.password || "");
    if (!isEmail(email) || !/^\d{6}$/.test(code)) return error("Codigo ou email invalido.", 400);
    if (!validatePassword(password)) return error("A senha precisa ter pelo menos 8 caracteres.", 400);

    if (shouldUseDevDb()) {
      const db = readDevDb();
      const user = db.users.find((item) => item.email === email);
      if (!user) return error("Codigo invalido ou expirado.", 400);
      const reset = db.resetCodes.find((item) => item.user_id === user.id && item.code_hash === hashCode(code) && !item.used_at);
      if (!reset || new Date(reset.expires_at).getTime() < Date.now()) return error("Codigo invalido ou expirado.", 400);
      user.password_hash = hashPassword(password);
      user.updated_at = nowIso();
      reset.used_at = nowIso();
      writeDevDb(db);
      return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso." });
    }

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (!user) return error("Codigo invalido ou expirado.", 400);

    const { data: reset } = await supabase
      .from("password_reset_codes")
      .select("id, expires_at, used_at")
      .eq("user_id", user.id)
      .eq("code_hash", hashCode(code))
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reset || new Date(reset.expires_at).getTime() < Date.now()) return error("Codigo invalido ou expirado.", 400);

    await supabase.from("users").update({ password_hash: hashPassword(password), updated_at: new Date().toISOString() }).eq("id", user.id);
    await supabase.from("password_reset_codes").update({ used_at: new Date().toISOString() }).eq("id", reset.id);
    return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso." });
  } catch {
    return error("Nao foi possivel redefinir a senha.", 500);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
