import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { hashPassword } from "@/lib/server/password";
import { normalizeUsername, isEmail, validatePassword } from "@/lib/server/validation";
import { setSessionCookie, signSession } from "@/lib/server/session";
import { createDevId, nowIso, readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = normalizeUsername(String(body.username || ""));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || username.length < 3) return error("Nome de usuario invalido.", 400);
    if (!isEmail(email)) return error("Email invalido.", 400);
    if (!validatePassword(password)) return error("A senha precisa ter pelo menos 8 caracteres.", 400);

    if (shouldUseDevDb()) {
      const db = readDevDb();
      if (db.users.some((user) => user.username === username)) return error("Esse nome já está sendo usado.", 409);
      if (db.users.some((user) => user.email === email)) return error("Esse email ja esta cadastrado.", 409);
      const user = {
        id: createDevId(),
        username,
        email,
        password_hash: hashPassword(password),
        onboarding_completed: false,
        onboarding_data: {},
        created_at: nowIso(),
        updated_at: nowIso()
      };
      db.users.push(user);
      writeDevDb(db);
      const token = await signSession({ userId: user.id, username: user.username, onboardingCompleted: user.onboarding_completed });
      const response = NextResponse.json({ ok: true, redirectTo: "/onboarding" });
      setSessionCookie(response, token);
      return response;
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
    if (existing) return error("Esse nome já está sendo usado.", 409);

    const { data: emailExisting } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (emailExisting) return error("Esse email ja esta cadastrado.", 409);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert({ username, email, password_hash: hashPassword(password) })
      .select("id, username, onboarding_completed")
      .single();

    if (insertError) return error("Nao foi possivel criar sua conta.", 500);

    const token = await signSession({ userId: user.id, username: user.username, onboardingCompleted: user.onboarding_completed });
    const response = NextResponse.json({ ok: true, redirectTo: "/onboarding" });
    setSessionCookie(response, token);
    return response;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Erro inesperado no cadastro.";
    return error(message, 500);
  }
}

function error(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}
