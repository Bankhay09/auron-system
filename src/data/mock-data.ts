import type { DailyQuestLog, Habit, PerformancePoint, PlayerProfile, SystemEvent } from "@/types/auron";

export const player: PlayerProfile = {
  username: "Bankai",
  title: "Awakening Player",
  level: 2,
  rank: "E",
  totalXp: 165,
  currentXp: 65,
  nextLevelXp: 100,
  coins: 420,
  streak: 1,
  hp: 0,
  discipline: 65,
  themeState: "normal"
};

export const habits: Habit[] = [
  habit("treino", "Treino", "body", 1, "check", 0, 20, 5, true),
  habit("java", "Java", "study", 1, "session", 0, 20, 5, true),
  habit("anti-vicio", "Anti-vício", "discipline", 1, "check", 0, 20, 5, true),
  habit("ingles", "Inglês", "language", 1, "session", 0, 10, 2, false),
  habit("japones", "Japonês", "language", 1, "session", 0, 10, 2, false),
  habit("guitarra", "Guitarra", "creative", 1, "session", 0, 10, 2, false),
  habit("leitura", "Leitura", "study", 1, "session", 0, 10, 2, false),
  habit("sono", "Sono", "health", 1, "check", 0, 10, 2, false)
];

export const dailyQuest: DailyQuestLog = {
  date: "2026-04-30",
  completed: false,
  totalXp: 0,
  totalCoins: 0,
  validDay: false,
  perfectDay: false,
  penaltyApplied: false,
  habits
};

export const weeklyPerformance: PerformancePoint[] = [
  { label: "Sex", xp: 0, score: 0, tasks: 0, valid: false },
  { label: "Sáb", xp: 0, score: 0, tasks: 0, valid: false },
  { label: "Dom", xp: 0, score: 0, tasks: 0, valid: false },
  { label: "Seg", xp: 0, score: 0, tasks: 0, valid: false },
  { label: "Ter", xp: 0, score: 0, tasks: 0, valid: false },
  { label: "Qua", xp: 165, score: 100, tasks: 8, valid: true },
  { label: "Qui", xp: 0, score: 0, tasks: 0, valid: false }
];

export const monthlyPerformance = Array.from({ length: 30 }, (_, index) => ({
  label: String(index + 1),
  xp: index === 29 ? 165 : 0,
  score: index === 29 ? 100 : 0,
  tasks: index === 29 ? 8 : 0,
  valid: index === 29
}));

export const events: SystemEvent[] = [
  {
    id: "evt-1",
    eventType: "reward",
    title: "[REWARD]",
    message: "Suas recompensas chegaram.",
    createdAt: "2026-04-30T00:00:00Z"
  },
  {
    id: "evt-2",
    eventType: "level-up",
    title: "[LEVEL UP]",
    message: "Você subiu para o nível 2.",
    createdAt: "2026-04-30T00:00:00Z"
  }
];

function habit(
  id: string,
  name: Habit["name"],
  category: Habit["category"],
  targetValue: number,
  targetUnit: string,
  currentValue: number,
  xpReward: number,
  coinReward: number,
  required: boolean
): Habit {
  return {
    id,
    name,
    category,
    type: "daily",
    targetValue,
    targetUnit,
    currentValue,
    xpReward,
    coinReward,
    penaltyXp: required ? 10 : 0,
    required,
    completed: currentValue >= targetValue
  };
}
