import type { PerformancePoint } from "@/types/auron";

export function WeeklyMatrix({ data }: { data: PerformancePoint[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {data.map((day) => (
        <div key={day.label} className={`grid min-h-16 place-items-center rounded-lg border p-2 text-center ${day.valid ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/20" : "border-white/10 bg-white/[0.04]"}`}>
          <span className="text-[10px] uppercase text-[#a9dfff]">{day.label}</span>
          <strong className="text-xl">{day.tasks}</strong>
          <span className="text-[10px] text-[#a9dfff]">{day.xp} XP</span>
        </div>
      ))}
    </div>
  );
}
