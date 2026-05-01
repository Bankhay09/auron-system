import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { verifyPassword } from "@/lib/server/password";
import { setSessionCookie, signSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || "").trim().toLowerCase();
    const password = String(body.password || "");
    const supabase = getSupabaseAdmin();

    const query = login.includes("@")
      ? supabase.from("users").select("id, username, email, password_hash, onboarding_completed").eq("email", login)
      : supabase.from("users").select("id, username, email, password_hash, onboarding_completed").eq("username", login);

    const { data: user } = await query.maybeSingle();
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ ok: false, message: "Email, usuario ou senha incorretos." }, { status: 401 });
    }

    const token = await signSession({ userId: user.id, username: user.username, onboardingCompleted: user.onboarding_completed });
    const response = NextResponse.json({ ok: true, redirectTo: user.onboarding_completed ? "/dashboard" : "/onboarding" });
    setSessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Erro inesperado no login." }, { status: 500 });
  }
}
