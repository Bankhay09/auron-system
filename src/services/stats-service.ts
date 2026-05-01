import { monthlyPerformance, weeklyPerformance } from "@/data/mock-data";

export async function getWeeklyStats() {
  return weeklyPerformance;
}

export async function getMonthlyStats() {
  return monthlyPerformance;
}

