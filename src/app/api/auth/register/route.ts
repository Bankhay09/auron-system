import { NextResponse } from "next/server";
import { getSupabaseAdmin, SupabaseAdminConfigError } from "@/lib/server/supabase-admin";
import { hashPassword } from "@/lib/server/password";
import { normalizeUsername, isEmail, validatePassword } from "@/lib/server/validation";
import { setSessionCookie, signSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = normalizeUsername(String(body.username || ""));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || username.length < 3) return error("Nome de usuario invalido.", 400);
    if (!isEmail(email)) return error("Email invalido.", 400);
    if (!validatePassword(password)) return error("A senha precisa ter pelo menos 8 caracteres.", 400);

    const supabase = getSupabaseAdmin();
    const { data: existing, error: usernameError } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
    if (usernameError) return supabaseError("verificar nome de usuario", usernameError);
    if (existing) return error("Esse nome ja esta sendo usado.", 409);

    const { data: emailExisting, error: emailError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (emailError) return supabaseError("verificar email", emailError);
    if (emailExisting) return error("Esse email ja esta cadastrado.", 409);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert({ username, email, password_hash: hashPassword(password) })
      .select("id, username, onboarding_completed")
      .single();

    if (insertError) return supabaseError("inserir usuario", insertError);

    const token = await signSession({ userId: user.id, username: user.username, onboardingCompleted: user.onboarding_completed });
    const response = NextResponse.json({ ok: true, redirectTo: "/onboarding" });
    setSessionCookie(response, token);
    return response;
  } catch (caught) {
    console.error("[api/auth/register] erro inesperado", formatCaughtError(caught));
    if (caught instanceof SupabaseAdminConfigError) {
      return error(caught.message, 500, { missing: caught.missing });
    }
    const message = caught instanceof Error ? caught.message : "Erro inesperado no cadastro.";
    return error(`Erro inesperado no cadastro: ${message}`, 500);
  }
}

function supabaseError(action: string, caught: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[api/auth/register] erro Supabase ao ${action}`, caught);
  const parts = [caught.message, caught.code && `code=${caught.code}`, caught.details && `details=${caught.details}`, caught.hint && `hint=${caught.hint}`].filter(Boolean);
  return error(`Erro Supabase ao ${action}: ${parts.join(" | ") || "sem detalhes"}`, 500, {
    code: caught.code,
    details: caught.details,
    hint: caught.hint
  });
}

function formatCaughtError(caught: unknown) {
  if (caught instanceof Error) {
    return { name: caught.name, message: caught.message, stack: caught.stack };
  }
  return { value: caught };
}

function error(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}
