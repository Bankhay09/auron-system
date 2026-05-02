import type { DailyQuestLog, Habit, PerformancePoint, PlayerProfile, Rank, SystemEvent } from "@/types/auron";
import { calculateRank } from "@/lib/ranking";

const DAY_MS = 24 * 60 * 60 * 1000;

export type OnboardingData = {
  mainGoal?: string;
  currentSituation?: string;
  habitsToAbandon?: string[];
  habitsToImplement?: string[];
};

export type AttributeMetric = {
  attribute: string;
  value: number;
};

export type AuronState = {
  daily: DailyQuestLog;
  history: DailyQuestLog[];
  events: SystemEvent[];
  lastCompletedAt?: string;
};

export type AuronSnapshot = {
  player: PlayerProfile;
  daily: DailyQuestLog;
  history: DailyQuestLog[];
  events: SystemEvent[];
  weeklyPerformance: PerformancePoint[];
  monthlyPerformance: PerformancePoint[];
  weeklyProgress: number;
  monthlyProgress: number;
  attributes: AttributeMetric[];
  skillScores: { id: string; name: string; value: number }[];
  dayProgress: number;
  predictedXp: number;
  predictedCoins: number;
  completedTasks: number;
  requiredFailed: boolean;
  allCompleted: boolean;
  diaryWritten: boolean;
  finalColor: string | null;
  lastCompletedAt?: string;
};

export function todayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export function buildSnapshot(state: AuronState, username: string, diaryWritten = false): AuronSnapshot {
  const allLogs = [...state.history, state.daily];
  const totalXp = allLogs.reduce((sum, day) => sum + day.totalXp, 0);
  const totalCoins = allLogs.reduce((sum, day) => sum + day.totalCoins, 0);
  const level = Math.floor(totalXp / 100) + 1;
  const completedTasks = state.daily.habits.filter((habit) => habit.completed).length;
  const allCompleted = state.daily.habits.length > 0 && completedTasks === state.daily.habits.length;
  const dayProgress = state.daily.habits.length ? Math.round((completedTasks / state.daily.habits.length) * 100) : 0;
  const requiredFailed = state.daily.habits.some((habit) => habit.required && !habit.completed);
  const predicted = calculateRewards(state.daily);
  const weeklyPerformance = rangePerformance(allLogs, 7);
  const monthlyPerformance = rangePerformance(allLogs, 30);

  return {
    player: {
      username,
      title: "Awakening Player",
      level,
      rank: calculateRank(totalXp),
      totalXp,
      currentXp: totalXp % 100,
      nextLevelXp: 100,
      coins: totalCoins,
      streak: calculateStreak(allLogs),
      hp: state.daily.validDay ? 100 : Math.max(0, dayProgress - (requiredFailed ? 30 : 0)),
      discipline: dayProgress,
      themeState: state.daily.penaltyApplied ? "penalty" : allCompleted ? "reward" : "normal"
    },
    daily: state.daily,
    history: state.history,
    events: deriveEvents(state),
    weeklyPerformance,
    monthlyPerformance,
    weeklyProgress: averageScore(weeklyPerformance),
    monthlyProgress: averageScore(monthlyPerformance),
    attributes: buildAttributes(allLogs, state.daily.habits),
    skillScores: buildSkillScores(allLogs, state.daily.habits),
    dayProgress,
    predictedXp: predicted.xp,
    predictedCoins: predicted.coins,
    completedTasks,
    requiredFailed,
    allCompleted,
    diaryWritten,
    finalColor: allCompleted && state.lastCompletedAt ? urgencyColor(progressThroughDay(new Date(state.lastCompletedAt))) : null,
    lastCompletedAt: state.lastCompletedAt
  };
}

export function createDaily(date: string, habits: Habit[], completed = false, totalXp = 0, totalCoins = 0, penaltyApplied = false, lastCompletedAt?: string): DailyQuestLog {
  const completedTasks = habits.filter((habit) => habit.completed).length;
  const requiredFailed = habits.some((habit) => habit.required && !habit.completed);
  return {
    date,
    completed,
    totalXp: completed ? Math.max(0, totalXp) : 0,
    totalCoins: completed ? Math.max(0, totalCoins) : 0,
    validDay: completed && completedTasks >= 3 && !requiredFailed,
    perfectDay: completed && habits.length > 0 && completedTasks === habits.length,
    penaltyApplied: completed ? penaltyApplied || requiredFailed || completedTasks < 2 : false,
    habits
  };
}

export function buildQuestHabits(onboarding?: OnboardingData): Habit[] {
  const raw = onboarding?.habitsToImplement as unknown;
  const implement = Array.isArray(raw)
    ? raw.filter(Boolean).map(String)
    : typeof raw === "string"
      ? raw.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
      : [];
  const source = implement.length ? implement : ["Definir primeiro pacto", "Escrever diario", "Organizar ambiente", "Planejar treino"];
  return source.slice(0, 8).map((name, index) =>
    habit(slugify(name, index), name, inferCategory(name), 1, "check", index < 4 ? 20 : 12, index < 4 ? 5 : 2, index < 4)
  );
}

export function calculateRewards(daily: DailyQuestLog) {
  const completed = daily.habits.filter((habit) => habit.completed);
  const lowTaskPenalty = daily.completed && completed.length < 2 ? 10 : 0;
  const workoutBonus = daily.habits.find((habit) => habit.name.toLowerCase().includes("treino"))?.completed ? 10 : 0;
  const restBonus = daily.completed && !isWorkoutDay(daily.date) && !daily.habits.find((habit) => habit.name.toLowerCase().includes("treino"))?.completed ? 5 : 0;
  const xp = completed.reduce((sum, habit) => sum + habit.xpReward, 0) + workoutBonus + restBonus - lowTaskPenalty;
  const coins = completed.reduce((sum, habit) => sum + habit.coinReward, 0) + (completed.length === daily.habits.length ? 20 : 0);
  return { xp: Math.max(0, xp), coins: Math.max(0, coins) };
}

export function progressThroughDay(date = new Date()) {
  return (date.getHours() * 60 + date.getMinutes()) / 1440;
}

export function urgencyColor(progress: number) {
  if (progress < 0.45) return "#2fffd2";
  if (progress < 0.72) return "#fff05a";
  return "#ff4d38";
}

export function event(eventType: SystemEvent["eventType"], title: string, message: string): SystemEvent {
  return {
    id: `${eventType}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    eventType,
    title: `[${title}]`,
    message,
    createdAt: new Date().toISOString()
  };
}

function buildAttributes(logs: DailyQuestLog[], fallbackHabits: Habit[]): AttributeMetric[] {
  const skill = buildSkillScores(logs, fallbackHabits);
  const top = skill.slice(0, 5);
  return top.length ? top.map((item) => ({ attribute: item.name.slice(0, 14), value: item.value })) : [{ attribute: "Sistema", value: 0 }];
}

function buildSkillScores(logs: DailyQuestLog[], fallbackHabits: Habit[]) {
  return fallbackHabits.map((habit) => {
    const samples = logs.filter((day) => day.completed && day.habits.some((item) => item.id === habit.id));
    const completed = samples.filter((day) => day.habits.find((item) => item.id === habit.id)?.completed).length;
    const value = samples.length ? Math.round((completed / samples.length) * 100) : habit.completed ? 100 : 0;
    return { id: habit.id, name: habit.name, value };
  });
}

function deriveEvents(state: AuronState): SystemEvent[] {
  const events = [...state.events];
  if (state.daily.completed && state.daily.totalXp > 0) {
    events.unshift(event("quest-complete", "QUEST COMPLETA", `Recompensa coletada: +${state.daily.totalXp} XP e +${state.daily.totalCoins} moedas.`));
  }
  if (state.daily.penaltyApplied) {
    events.unshift(event("penalty", "QUEST INCOMPLETA", "Falha detectada no protocolo diario."));
  }
  return uniqueEvents(events).slice(0, 4);
}

function rangePerformance(logs: DailyQuestLog[], days: number): PerformancePoint[] {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS);
    const key = todayKey(date);
    const log = logs.find((item) => item.date === key);
    const tasks = log?.habits.filter((habit) => habit.completed).length ?? 0;
    const total = log?.habits.length ?? 8;
    return {
      label: date.toLocaleDateString("pt-BR", days === 7 ? { weekday: "short" } : { day: "2-digit" }).replace(".", ""),
      xp: log?.totalXp ?? 0,
      score: log ? Math.round((tasks / total) * 100) : 0,
      tasks,
      valid: Boolean(log?.validDay)
    };
  });
}

function calculateStreak(logs: DailyQuestLog[]) {
  let streak = 0;
  const byDate = new Map(logs.map((log) => [log.date, log]));
  for (let offset = 0; offset < 90; offset++) {
    const key = todayKey(new Date(startOfDay(new Date()).getTime() - offset * DAY_MS));
    const log = byDate.get(key);
    if (!log?.validDay) break;
    streak++;
  }
  return streak;
}

function averageScore(points: PerformancePoint[]) {
  if (!points.length) return 0;
  return Math.round(points.reduce((sum, point) => sum + point.score, 0) / points.length);
}

function isWorkoutDay(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 1 || day === 3 || day === 5;
}

function habit(id: string, name: string, category: Habit["category"], targetValue: number, targetUnit: string, xpReward: number, coinReward: number, required: boolean): Habit {
  return {
    id,
    name,
    category,
    type: "daily",
    targetValue,
    targetUnit,
    currentValue: 0,
    xpReward,
    coinReward,
    penaltyXp: required ? 10 : 0,
    required,
    completed: false
  };
}

function slugify(value: string, index: number) {
  const slug = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || `habito-${index + 1}`;
}

function inferCategory(name: string): Habit["category"] {
  const text = name.toLowerCase();
  if (/trein|exerc|academ|corr|sono|dorm/.test(text)) return "body";
  if (/estud|java|ler|leitur|curso|aula/.test(text)) return "study";
  if (/guitar|musica|desenh|cri/.test(text)) return "creative";
  if (/ingles|japones|idioma/.test(text)) return "language";
  if (/vicio|procrast|disciplina|celular/.test(text)) return "discipline";
  return "health";
}

function uniqueEvents(events: SystemEvent[]) {
  const seen = new Set<string>();
  return events.filter((item) => {
    const key = `${item.eventType}-${item.title}-${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
