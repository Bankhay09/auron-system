import type { Rank } from "@/types/auron";

export const RANK_THRESHOLDS: Array<{ rank: Rank; xp: number }> = [
  { rank: "E", xp: 0 },
  { rank: "D", xp: 500 },
  { rank: "C", xp: 2000 },
  { rank: "B", xp: 5000 },
  { rank: "A", xp: 10000 },
  { rank: "S", xp: 25000 },
  { rank: "SS", xp: 50000 },
  { rank: "SSS", xp: 100000 }
];

export function calculateRank(xp: number): Rank {
  if (xp >= 100000) return "SSS";
  if (xp >= 50000) return "SS";
  if (xp >= 25000) return "S";
  if (xp >= 10000) return "A";
  if (xp >= 5000) return "B";
  if (xp >= 2000) return "C";
  if (xp >= 500) return "D";
  return "E";
}

export function rankProgress(xp: number) {
  const rank = calculateRank(xp);
  const index = RANK_THRESHOLDS.findIndex((item) => item.rank === rank);
  const current = RANK_THRESHOLDS[index] ?? RANK_THRESHOLDS[0];
  const next = RANK_THRESHOLDS[index + 1] ?? null;
  if (!next) {
    return {
      rank,
      currentRankXp: current.xp,
      nextRank: null,
      nextRankXp: null,
      progress: 100,
      remainingXp: 0
    };
  }
  const span = next.xp - current.xp;
  const progress = span > 0 ? Math.max(0, Math.min(100, Math.round(((xp - current.xp) / span) * 100))) : 100;
  return {
    rank,
    currentRankXp: current.xp,
    nextRank: next.rank,
    nextRankXp: next.xp,
    progress,
    remainingXp: Math.max(0, next.xp - xp)
  };
}
