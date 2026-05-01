import { NextResponse } from "next/server";
import { getSession, setSessionCookie, signSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { nowIso, readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";
import { parseHabitList, validatePersonalDevelopmentHabits } from "@/lib/server/validation";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  const data = await request.json();
  const habitsToAbandon = parseHabitList(data.habitsToAbandon);
  const habitsToImplement = parseHabitList(data.habitsToImplement);
  if (!validatePersonalDevelopmentHabits([...habitsToAbandon, ...habitsToImplement])) {
    return NextResponse.json({ ok: false, message: "Esse hábito não é válido para desenvolvimento pessoal." }, { status: 400 });
  }

  const payload = {
    mainGoal: String(data.mainGoal || "").slice(0, 280),
    currentSituation: String(data.currentSituation || "").slice(0, 1000),
    habitsToAbandon,
    habitsToImplement
  };

  if (shouldUseDevDb()) {
    const db = readDevDb();
    const user = db.users.find((item) => item.id === session.userId);
    if (!user) return NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 });
    user.onboarding_completed = true;
    user.onboarding_data = payload;
    user.updated_at = nowIso();
    writeDevDb(db);
    const token = await signSession({ userId: session.userId, username: session.username, onboardingCompleted: true });
    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    setSessionCookie(response, token);
    return response;
  }

  const supabase = getSupabaseAdmin();
  await supabase.from("users").update({ onboarding_completed: true, onboarding_data: payload, updated_at: new Date().toISOString() }).eq("id", session.userId);

  const token = await signSession({ userId: session.userId, username: session.username, onboardingCompleted: true });
  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  setSessionCookie(response, token);
  return response;
}
