export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS";

export type SystemState =
  | "normal"
  | "level-up"
  | "rank-up"
  | "quest-complete"
  | "quest-failed"
  | "penalty"
  | "reward"
  | "focus-mode"
  | "boss-mode";

export type HabitCategory = "body" | "study" | "discipline" | "language" | "creative" | "health";

export type PlayerProfile = {
  username: string;
  title: string;
  level: number;
  rank: Rank;
  totalXp: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number;
  streak: number;
  hp: number;
  discipline: number;
  themeState: SystemState;
};

export type Habit = {
  id: string;
  name: string;
  category: HabitCategory;
  type: "daily" | "side" | "weekly";
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  xpReward: number;
  coinReward: number;
  penaltyXp: number;
  required: boolean;
  completed: boolean;
};

export type DailyQuestLog = {
  date: string;
  completed: boolean;
  totalXp: number;
  totalCoins: number;
  validDay: boolean;
  perfectDay: boolean;
  penaltyApplied: boolean;
  habits: Habit[];
};

export type SystemEvent = {
  id: string;
  eventType: SystemState;
  title: string;
  message: string;
  createdAt: string;
};

export type PerformancePoint = {
  label: string;
  xp: number;
  score: number;
  tasks: number;
  valid: boolean;
};

