import type { Rank } from "@/types/auron";

export function RankBadge({ rank }: { rank: Rank }) {
  return (
    <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[radial-gradient(circle,var(--auron-primary),#4b1d6c)] text-lg font-black shadow-neon">
      {rank}
    </span>
  );
}

