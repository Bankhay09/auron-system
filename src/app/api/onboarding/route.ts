import { NextResponse } from "next/server";
import { getSession, setSessionCookie, signSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { parseHabitList, validatePersonalDevelopmentHabits } from "@/lib/server/validation";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  const data = await request.json();
  const habitsToAbandon = parseHabitList(data.habitsToAbandon);
  const habitsToImplement = parseHabitList(data.habitsToImplement);
  if (!validatePersonalDevelopmentHabits([...habitsToAbandon, ...habitsToImplement])) {
    return NextResponse.json({ ok: false, message: "Esse habito nao e valido para desenvolvimento pessoal." }, { status: 400 });
  }

  const payload = {
    mainGoal: String(data.mainGoal || "").slice(0, 280),
    currentSituation: String(data.currentSituation || "").slice(0, 1000),
    habitsToAbandon,
    habitsToImplement
  };

  const supabase = getSupabaseAdmin();
  await supabase.from("users").update({ onboarding_completed: true, onboarding_data: payload, updated_at: new Date().toISOString() }).eq("id", session.userId);

  const token = await signSession({ userId: session.userId, username: session.username, onboardingCompleted: true });
  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  setSessionCookie(response, token);
  return response;
}
