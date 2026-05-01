import { NextResponse } from "next/server";
import { getSession, setSessionCookie, signSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { parseHabitList, validatePersonalDevelopmentHabits } from "@/lib/server/validation";
import { buildQuestHabits } from "@/lib/auron-core";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  const data = await request.json();
  const habitsToAbandon = parseHabitList(data.habitsToAbandon);
  const habitsToImplement = parseHabitList(data.habitsToImplement);
  if (habitsToAbandon.length < 4 || habitsToImplement.length < 4) {
    return NextResponse.json({ ok: false, message: "Voce precisa inserir pelo menos 4 habitos para continuar." }, { status: 400 });
  }
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
  const { data: existingHabits } = await supabase.from("habits").select("id").eq("user_id", session.userId).limit(1);
  if (!existingHabits?.length) {
    const habits = buildQuestHabits(payload).map((habit) => ({
      user_id: session.userId,
      name: habit.name,
      category: habit.category,
      target_value: habit.targetValue,
      target_unit: habit.targetUnit,
      xp_reward: habit.xpReward,
      coin_reward: habit.coinReward,
      required: habit.required,
      active: true
    }));
    await supabase.from("habits").insert(habits);
  }

  const token = await signSession({ userId: session.userId, username: session.username, onboardingCompleted: true });
  const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  setSessionCookie(response, token);
  return response;
}
