"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DailyQuestLog, Habit, PerformancePoint, PlayerProfile, Rank, SystemEvent } from "@/types/auron";
import type { OnboardingData } from "@/lib/use-current-user";

const STORAGE_KEY = "auron-system-state-v3";
const DAY_MS = 24 * 60 * 60 * 1000;

type AuronState = {
  baseXp: number;
  baseCoins: number;
  daily: DailyQuestLog;
  history: DailyQuestLog[];
  events: SystemEvent[];
  lastCompletedAt?: string;
};

export type AttributeMetric = {
  attribute: string;
  value: number;
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
  finalColor: string | null;
  lastCompletedAt?: string;
};

export type AuronActions = {
  toggleHabit: (habitId: string) => void;
  completeQuest: () => void;
  closeDay: () => void;
  resetToday: () => void;
  resetSystem: () => void;
  getDebugState: () => string;
};

type AuronOptions = {
  userId?: string;
  username?: string;
  onboardingData?: OnboardingData;
};

export function useAuronSystem(options: AuronOptions = {}): AuronSnapshot & AuronActions {
  const userId = options.userId || "local";
  const storageKey = `${STORAGE_KEY}:${userId}`;
  const questHabits = useMemo(() => buildQuestHabits(options.onboardingData), [options.onboardingData]);
  const [state, setState] = useState<AuronState>(() => createInitialState(questHabits));
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setState(loadState(storageKey, questHabits));

    const midnightCheck = window.setInterval(() => {
      setState((current) => rolloverState(current, questHabits));
    }, 30 * 1000);

    const syncStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setState(loadState(storageKey, questHabits));
    };

    window.addEventListener("storage", syncStorage);
    return () => {
      window.clearInterval(midnightCheck);
      window.removeEventListener("storage", syncStorage);
    };
  }, [storageKey, questHabits]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const snapshot = useMemo(() => buildSnapshot(state, options.username || "Bankai"), [state, options.username]);

  function toggleHabit(habitId: string) {
    setState((current) => {
      if (current.daily.completed) return addEvent(current, event("normal", "QUEST LOCKED", "A Daily Quest de hoje ja foi finalizada."));
      const daily = {
        ...current.daily,
        habits: current.daily.habits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                completed: !habit.completed,
                currentValue: habit.completed ? 0 : habit.targetValue
              }
            : habit
          )
      };
      const next = normalizeDaily({ ...current, daily, lastCompletedAt: new Date().toISOString() });
      return next;
    });
  }

  function completeQuest() {
    setState((current) => {
      const before = buildSnapshot(current, options.username || "Bankai");
      if (current.daily.completed) {
        return addEvent(current, event("normal", "QUEST LOCKED", "A recompensa de hoje ja foi coletada."));
      }
      if (!before.allCompleted) {
        return addEvent(current, event("penalty", "QUEST INCOMPLETA", "Complete todas as tarefas antes de finalizar a Daily Quest."));
      }
      const predicted = calculateRewards(current.daily);
      const completed = normalizeDaily({
        ...current,
        daily: {
          ...current.daily,
          completed: true,
          totalXp: predicted.xp,
          totalCoins: predicted.coins,
          validDay: true,
          perfectDay: true,
          penaltyApplied: false
        },
        lastCompletedAt: new Date().toISOString()
      });
      return withProgressEvents(completed, before, true);
    });
  }

  function closeDay() {
    setState((current) => {
      const before = buildSnapshot(current, options.username || "Bankai");
      if (current.daily.completed) {
        return addEvent(current, event("normal", "QUEST LOCKED", "A Daily Quest de hoje ja foi encerrada."));
      }
      const predicted = calculateRewards(current.daily);
      const shouldApply = before.allCompleted;
      const daily = normalizeDaily({
        ...current,
        daily: {
          ...current.daily,
          completed: true,
          totalXp: shouldApply ? predicted.xp : 0,
          totalCoins: shouldApply ? predicted.coins : 0,
          penaltyApplied: !shouldApply || current.daily.penaltyApplied
        },
        lastCompletedAt: current.lastCompletedAt ?? new Date().toISOString()
      });
      return withProgressEvents(daily, before, true);
    });
  }

  function resetToday() {
    setState(createInitialState(questHabits));
  }

  function resetSystem() {
    const fresh = createInitialState(questHabits);
    localStorage.removeItem(storageKey);
    setState(fresh);
  }

  function getDebugState() {
    return JSON.stringify(state, null, 2);
  }

  return { ...snapshot, toggleHabit, completeQuest, closeDay, resetToday, resetSystem, getDebugState };
}

export function todayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

function loadState(storageKey: string, habits: Habit[]): AuronState {
  try {
    if (typeof window === "undefined") return createInitialState(habits);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return createInitialState(habits);
    return rolloverState(syncHabits(JSON.parse(raw) as AuronState, habits), habits);
  } catch {
    return createInitialState(habits);
  }
}

function rolloverState(state: AuronState, habits: Habit[]): AuronState {
  const today = todayKey();
  if (state.daily.date === today) return normalizeDaily(state);

  const wasCompleted = state.daily.completed;
  const archived = normalizeDaily({
    ...state,
    daily: {
      ...state.daily,
      completed: true,
      totalXp: wasCompleted ? state.daily.totalXp : 0,
      totalCoins: wasCompleted ? state.daily.totalCoins : 0,
      penaltyApplied: !wasCompleted || state.daily.penaltyApplied
    }
  }).daily;
  const history = [...state.history.filter((item) => item.date !== archived.date), archived].slice(-180);
  return normalizeDaily({
    ...state,
    daily: createDaily(today, habits),
    history,
    events: [
      event("normal", "NEW DAILY QUEST", "Um novo dia foi iniciado. As missoes foram resetadas."),
      ...state.events
    ].slice(0, 12),
    lastCompletedAt: undefined
  });
}

function createInitialState(habits: Habit[]): AuronState {
  return normalizeDaily({
    baseXp: 0,
    baseCoins: 0,
    daily: createDaily(todayKey(), habits),
    history: [],
    events: [event("normal", "SYSTEM ONLINE", "Auron System iniciou o monitoramento do player.")],
    lastCompletedAt: undefined
  });
}

function createDaily(date: string, habits: Habit[]): DailyQuestLog {
  return {
    date,
    completed: false,
    totalXp: 0,
    totalCoins: 0,
    validDay: false,
    perfectDay: false,
    penaltyApplied: false,
    habits
  };
}

function normalizeDaily(state: AuronState): AuronState {
  const completed = state.daily.habits.filter((habit) => habit.completed);
  const antiVicioFailed = state.daily.completed && !state.daily.habits.find((habit) => habit.id === "anti-vicio")?.completed;
  const lowTaskPenalty = state.daily.completed && completed.length < 2 ? 10 : 0;
  const requiredFailed = state.daily.habits.some((habit) => habit.required && !habit.completed);
  const validDay = completed.length >= 3 && !requiredFailed;
  const perfectDay = completed.length === state.daily.habits.length;
  const appliedXp = state.daily.completed ? state.daily.totalXp : 0;
  const appliedCoins = state.daily.completed ? state.daily.totalCoins : 0;

  return {
    ...state,
    daily: {
      ...state.daily,
      totalXp: Math.max(0, appliedXp),
      totalCoins: Math.max(0, appliedCoins),
      validDay,
      perfectDay,
      penaltyApplied: state.daily.penaltyApplied || antiVicioFailed || lowTaskPenalty > 0
    }
  };
}

function buildSnapshot(state: AuronState, username: string): AuronSnapshot {
  const allLogs = [...state.history, state.daily];
  const todayXp = state.daily.totalXp;
  const totalHistoryXp = state.history.reduce((sum, day) => sum + day.totalXp, 0);
  const totalHistoryCoins = state.history.reduce((sum, day) => sum + day.totalCoins, 0);
  const totalXp = state.baseXp + totalHistoryXp + todayXp;
  const level = Math.floor(totalXp / 100) + 1;
  const rank = resolveRank(totalXp);
  const currentXp = totalXp % 100;
  const completedTasks = state.daily.habits.filter((habit) => habit.completed).length;
  const allCompleted = completedTasks === state.daily.habits.length;
  const dayProgress = Math.round((completedTasks / state.daily.habits.length) * 100);
  const requiredFailed = state.daily.habits.some((habit) => habit.required && !habit.completed);
  const predicted = calculateRewards(state.daily);
  const weeklyPerformance = rangePerformance(allLogs, 7);
  const monthlyPerformance = rangePerformance(allLogs, 30);

  return {
    player: {
      username,
      title: "Awakening Player",
      level,
      rank,
      totalXp,
      currentXp,
      nextLevelXp: 100,
      coins: state.baseCoins + totalHistoryCoins + state.daily.totalCoins,
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
    finalColor: allCompleted && state.lastCompletedAt ? urgencyColor(progressThroughDay(new Date(state.lastCompletedAt))) : null,
    lastCompletedAt: state.lastCompletedAt
  };
}

function withProgressEvents(next: AuronState, before: AuronSnapshot, forceSummary = false): AuronState {
  const after = buildSnapshot(next, before.player.username);
  const events = [...next.events];
  if (after.player.level > before.player.level) {
    events.unshift(event("level-up", "LEVEL UP", `Voce subiu para o nivel ${after.player.level}.`));
  }
  if (after.player.rank !== before.player.rank) {
    events.unshift(event("rank-up", "RANK UP", `Rank ${after.player.rank} alcancado.`));
  }
  if (!before.daily.completed && after.daily.completed && after.daily.totalXp > 0) {
    events.unshift(event("reward", "REWARD", `Quest diaria completa. +${after.daily.totalXp} XP e +${after.daily.totalCoins} moedas.`));
  }
  if (forceSummary && after.requiredFailed) {
    events.unshift(event("penalty", "QUEST INCOMPLETA", "A Daily Quest foi encerrada sem completar todos os objetivos."));
  }
  return { ...next, events: events.slice(0, 12) };
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

function calculateRewards(daily: DailyQuestLog) {
  const completed = daily.habits.filter((habit) => habit.completed);
  const antiVicioFailed = daily.completed && !daily.habits.find((habit) => habit.id === "anti-vicio")?.completed;
  const lowTaskPenalty = daily.completed && completed.length < 2 ? 10 : 0;
  const antiPenalty = antiVicioFailed ? 30 : 0;
  const workoutBonus = daily.habits.find((habit) => habit.id === "treino")?.completed ? 10 : 0;
  const restBonus = daily.completed && !isWorkoutDay(daily.date) && !daily.habits.find((habit) => habit.id === "treino")?.completed ? 5 : 0;
  const xp = completed.reduce((sum, habit) => sum + habit.xpReward, 0) + workoutBonus + restBonus - antiPenalty - lowTaskPenalty;
  const coins = completed.reduce((sum, habit) => sum + habit.coinReward, 0) + (completed.length === daily.habits.length ? 20 : 0);
  return { xp: Math.max(0, xp), coins: Math.max(0, coins) };
}

function averageScore(points: PerformancePoint[]) {
  if (!points.length) return 0;
  return Math.round(points.reduce((sum, point) => sum + point.score, 0) / points.length);
}

function addEvent(state: AuronState, nextEvent: SystemEvent): AuronState {
  return { ...state, events: [nextEvent, ...state.events].slice(0, 12) };
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

function resolveRank(xp: number): Rank {
  if (xp >= 7000) return "SS";
  if (xp >= 5000) return "S";
  if (xp >= 3000) return "A";
  if (xp >= 1800) return "B";
  if (xp >= 1000) return "C";
  if (xp >= 500) return "D";
  return "E";
}

export function progressThroughDay(date = new Date()) {
  return (date.getHours() * 60 + date.getMinutes()) / 1440;
}

export function urgencyColor(progress: number) {
  if (progress < 0.45) return "#2fffd2";
  if (progress < 0.72) return "#fff05a";
  return "#ff4d38";
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

function buildQuestHabits(onboarding?: OnboardingData): Habit[] {
  const raw = onboarding?.habitsToImplement as unknown;
  const implement = Array.isArray(raw)
    ? raw.filter(Boolean)
    : typeof raw === "string"
      ? raw.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
      : [];
  const source = implement.length ? implement : ["Definir primeiro pacto", "Escrever diario", "Organizar ambiente", "Planejar treino"];
  return source.slice(0, 8).map((name, index) =>
    habit(slugify(name, index), name, inferCategory(name), 1, "check", index < 4 ? 20 : 12, index < 4 ? 5 : 2, index < 4)
  );
}

function syncHabits(state: AuronState, habits: Habit[]) {
  const existing = new Map(state.daily.habits.map((item) => [item.id, item]));
  return {
    ...state,
    daily: {
      ...state.daily,
      habits: habits.map((habit) => ({ ...habit, completed: existing.get(habit.id)?.completed ?? false, currentValue: existing.get(habit.id)?.currentValue ?? 0 }))
    }
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

function event(eventType: SystemEvent["eventType"], title: string, message: string): SystemEvent {
  return {
    id: `${eventType}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    eventType,
    title: `[${title}]`,
    message,
    createdAt: new Date().toISOString()
  };
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
