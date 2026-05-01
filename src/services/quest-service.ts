import { dailyQuest } from "@/data/mock-data";

export async function getTodayQuest() {
  return dailyQuest;
}

export async function completeDailyQuest() {
  return { ...dailyQuest, completed: true, validDay: true };
}

