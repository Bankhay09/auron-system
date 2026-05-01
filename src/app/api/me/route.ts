import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { nowIso, readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  if (shouldUseDevDb()) {
    const db = readDevDb();
    const user = db.users.find((item) => item.id === session.userId);
    if (!user) return NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        onboardingCompleted: user.onboarding_completed,
        onboardingData: user.onboarding_data,
        theme: user.theme || "cyan"
      }
    });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("id, username, email, onboarding_completed, onboarding_data, theme").eq("id", session.userId).maybeSingle();
  if (!user) return NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 });
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      onboardingCompleted: user.onboarding_completed,
      onboardingData: user.onboarding_data,
      theme: user.theme || "cyan"
    }
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const body = await request.json();
  const theme = String(body.theme || "cyan").replace(/[^a-z-]/g, "");

  if (shouldUseDevDb()) {
    const db = readDevDb();
    const user = db.users.find((item) => item.id === session.userId);
    if (!user) return NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 });
    user.theme = theme;
    user.updated_at = nowIso();
    writeDevDb(db);
    return NextResponse.json({ ok: true, theme });
  }

  const supabase = getSupabaseAdmin();
  await supabase.from("users").update({ theme, updated_at: new Date().toISOString() }).eq("id", session.userId);
  return NextResponse.json({ ok: true, theme });
}
