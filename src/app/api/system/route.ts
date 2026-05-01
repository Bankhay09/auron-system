import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { buildQuestHabits, buildSnapshot, calculateRewards, createDaily, event, todayKey, type AuronState, type OnboardingData } from "@/lib/auron-core";
import type { Habit } from "@/types/auron";

type DbHabit = {
  id: string;
  name: string;
  category: Habit["category"];
  target_value: number;
  target_unit: string;
  xp_reward: number;
  coin_reward: number;
  required: boolean;
  active: boolean;
};

type DbCheckin = {
  habit_id: string | null;
  checkin_date: string;
  completed: boolean;
  value: number;
  xp_earned: number;
};

type DbQuestLog = {
  quest_date: string;
  completed: boolean;
  total_xp: number;
  total_coins: number;
  valid_day: boolean;
  perfect_day: boolean;
  penalty_applied: boolean;
  last_completed_at: string | null;
};

type DbUser = {
  id: string;
  username: string;
  onboarding_data: OnboardingData;
};

export async function GET() {
  const loaded = await loadSystem();
  if ("response" in loaded) return loaded.response;
  return NextResponse.json({ ok: true, system: loaded.snapshot });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const loaded = await loadSystem();
  if ("response" in loaded) return loaded.response;

  const { supabase, session, habits, snapshot } = loaded;
  const today = todayKey();
  const todayLog = snapshot.daily;

  if (action === "toggleHabit") {
    if (todayLog.completed) return withSystem(loaded, "A Daily Quest de hoje ja foi finalizada.", 409);
    const habitId = String(body.habitId || "");
    const habit = todayLog.habits.find((item) => item.id === habitId);
    if (!habit) return withSystem(loaded, "Habito nao encontrado.", 404);
    const completed = !habit.completed;
    await supabase.from("habit_checkins").upsert({
      user_id: session.userId,
      habit_id: habit.id,
      checkin_date: today,
      completed,
      value: completed ? habit.targetValue : 0,
      xp_earned: 0
    }, { onConflict: "user_id,habit_id,checkin_date" });
    return reloadResponse();
  }

  if (action === "completeQuest") {
    if (todayLog.completed) return withSystem(loaded, "A recompensa de hoje ja foi coletada.", 409);
    if (!snapshot.diaryWritten) return withSystem(loaded, "Escreva o diario antes de finalizar a Daily Quest.", 400);
    if (!snapshot.allCompleted) return withSystem(loaded, "Complete todas as tarefas antes de finalizar a Daily Quest.", 400);
    const rewards = calculateRewards({ ...todayLog, completed: true });
    const now = new Date().toISOString();
    await supabase.from("daily_quest_logs").upsert({
      user_id: session.userId,
      quest_date: today,
      completed: true,
      total_xp: rewards.xp,
      total_coins: rewards.coins,
      valid_day: true,
      perfect_day: true,
      penalty_applied: false,
      last_completed_at: now
    }, { onConflict: "user_id,quest_date" });
    await Promise.all(habits.map((habit) =>
      supabase.from("habit_checkins").upsert({
        user_id: session.userId,
        habit_id: habit.id,
        checkin_date: today,
        completed: true,
        value: habit.targetValue,
        xp_earned: habit.xpReward
      }, { onConflict: "user_id,habit_id,checkin_date" })
    ));
    return reloadResponse();
  }

  if (action === "closeDay") {
    if (todayLog.completed) return withSystem(loaded, "A Daily Quest de hoje ja foi encerrada.", 409);
    if (!snapshot.diaryWritten) return withSystem(loaded, "Escreva o diario antes de encerrar o dia.", 400);
    const rewards = snapshot.allCompleted ? calculateRewards({ ...todayLog, completed: true }) : { xp: 0, coins: 0 };
    const now = new Date().toISOString();
    await supabase.from("daily_quest_logs").upsert({
      user_id: session.userId,
      quest_date: today,
      completed: true,
      total_xp: rewards.xp,
      total_coins: rewards.coins,
      valid_day: snapshot.allCompleted,
      perfect_day: snapshot.allCompleted,
      penalty_applied: !snapshot.allCompleted,
      last_completed_at: now
    }, { onConflict: "user_id,quest_date" });
    return reloadResponse();
  }

  if (action === "resetSystem") {
    await Promise.all([
      supabase.from("habit_checkins").delete().eq("user_id", session.userId),
      supabase.from("daily_quest_logs").delete().eq("user_id", session.userId),
      supabase.from("diary_entries").delete().eq("user_id", session.userId),
      supabase.from("ai_messages").delete().eq("user_id", session.userId),
      supabase.from("social_usage_logs").delete().eq("user_id", session.userId)
    ]);
    return reloadResponse();
  }

  return withSystem(loaded, "Acao invalida.", 400);

  async function reloadResponse() {
    const next = await loadSystem();
    if ("response" in next) return next.response;
    return NextResponse.json({ ok: true, system: next.snapshot });
  }
}

async function loadSystem() {
  const session = await getSession();
  if (!session) return { response: NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 }) };

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("id, username, onboarding_data").eq("id", session.userId).maybeSingle<DbUser>();
  if (!user) return { response: NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 }) };

  const habits = await ensureHabits(supabase, user);
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [{ data: checkins }, { data: questLogs }, { data: diary }] = await Promise.all([
    supabase.from("habit_checkins").select("habit_id, checkin_date, completed, value, xp_earned").eq("user_id", user.id).gte("checkin_date", since),
    supabase.from("daily_quest_logs").select("quest_date, completed, total_xp, total_coins, valid_day, perfect_day, penalty_applied, last_completed_at").eq("user_id", user.id).gte("quest_date", since).order("quest_date", { ascending: true }),
    supabase.from("diary_entries").select("id").eq("user_id", user.id).eq("entry_date", todayKey()).maybeSingle()
  ]);

  const state = buildState(habits, checkins ?? [], questLogs ?? []);
  const snapshot = buildSnapshot(state, user.username, Boolean(diary));
  return { supabase, session, user, habits, snapshot };
}

async function ensureHabits(supabase: ReturnType<typeof getSupabaseAdmin>, user: DbUser): Promise<Habit[]> {
  const { data } = await supabase.from("habits").select("id, name, category, target_value, target_unit, xp_reward, coin_reward, required, active").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: true });
  if (data?.length) return data.map(mapHabit);

  const generated = buildQuestHabits(user.onboarding_data);
  const rows = generated.map((habit) => ({
    user_id: user.id,
    name: habit.name,
    category: habit.category,
    target_value: habit.targetValue,
    target_unit: habit.targetUnit,
    xp_reward: habit.xpReward,
    coin_reward: habit.coinReward,
    required: habit.required,
    active: true
  }));
  const { data: inserted } = await supabase.from("habits").insert(rows).select("id, name, category, target_value, target_unit, xp_reward, coin_reward, required, active");
  return (inserted ?? []).map(mapHabit);
}

function buildState(habits: Habit[], checkins: DbCheckin[], questLogs: DbQuestLog[]): AuronState {
  const today = todayKey();
  const checkinsByDate = new Map<string, DbCheckin[]>();
  for (const checkin of checkins) {
    const group = checkinsByDate.get(checkin.checkin_date) ?? [];
    group.push(checkin);
    checkinsByDate.set(checkin.checkin_date, group);
  }
  const logsByDate = new Map(questLogs.map((log) => [log.quest_date, log]));
  const daily = buildDay(today, habits, checkinsByDate.get(today) ?? [], logsByDate.get(today));
  const history = questLogs.filter((log) => log.quest_date !== today).map((log) => buildDay(log.quest_date, habits, checkinsByDate.get(log.quest_date) ?? [], log));
  const events = daily.completed
    ? [event(daily.totalXp > 0 ? "reward" : "penalty", daily.totalXp > 0 ? "REWARD" : "QUEST INCOMPLETA", daily.totalXp > 0 ? "Suas recompensas chegaram." : "O protocolo diario foi encerrado com falha.")]
    : [event("normal", "SYSTEM ONLINE", "Auron System iniciou o monitoramento do player.")];
  return {
    daily,
    history,
    events,
    lastCompletedAt: logsByDate.get(today)?.last_completed_at ?? undefined
  };
}

function buildDay(date: string, baseHabits: Habit[], checkins: DbCheckin[], log?: DbQuestLog) {
  const byHabit = new Map(checkins.filter((checkin) => checkin.habit_id).map((checkin) => [checkin.habit_id as string, checkin]));
  const habits = baseHabits.map((habit) => {
    const checkin = byHabit.get(habit.id);
    return {
      ...habit,
      completed: Boolean(checkin?.completed),
      currentValue: checkin?.completed ? habit.targetValue : 0
    };
  });
  return createDaily(date, habits, Boolean(log?.completed), log?.total_xp ?? 0, log?.total_coins ?? 0, Boolean(log?.penalty_applied), log?.last_completed_at ?? undefined);
}

function mapHabit(row: DbHabit): Habit {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: "daily",
    targetValue: row.target_value,
    targetUnit: row.target_unit,
    currentValue: 0,
    xpReward: row.xp_reward,
    coinReward: row.coin_reward,
    penaltyXp: row.required ? 10 : 0,
    required: row.required,
    completed: false
  };
}

function withSystem(loaded: Awaited<ReturnType<typeof loadSystem>> & { snapshot: import("@/lib/auron-core").AuronSnapshot }, message: string, status: number) {
  return NextResponse.json({ ok: false, message, system: loaded.snapshot }, { status });
}
