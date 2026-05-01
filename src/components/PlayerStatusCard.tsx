import type { PlayerProfile } from "@/types/auron";
import { percent } from "@/lib/utils";
import { RankBadge } from "./RankBadge";
import { XpBar } from "./XpBar";

export function PlayerStatusCard({ player }: { player: PlayerProfile }) {
  return (
    <div className="auron-panel rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-[var(--auron-primary)] bg-black/40 shadow-neon">
          <span className="text-2xl font-black">{player.username.slice(0, 1)}</span>
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-black">{player.username}</h2>
          <p className="text-sm text-[#a9dfff]">{player.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <RankBadge rank={player.rank} />
            <span className="text-sm font-bold">Level {player.level}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <XpBar label="HP / Disciplina" value={player.hp} max={100} />
        <XpBar label={`XP ${player.currentXp}/${player.nextLevelXp}`} value={player.currentXp} max={player.nextLevelXp} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="XP Total" value={player.totalXp} />
        <MiniStat label="Coins" value={player.coins} />
        <MiniStat label="Streak" value={player.streak} />
      </div>
      <div className="mt-3 text-xs text-[#a9dfff]">Level progress {percent(player.currentXp, player.nextLevelXp)}%</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] uppercase text-[#a9dfff]">{label}</div>
    </div>
  );
}
