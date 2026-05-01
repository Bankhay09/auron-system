import type { PerformancePoint } from "@/types/auron";

export function DisciplineCalendar({ monthly }: { monthly: PerformancePoint[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {monthly.slice(-35).map((day, index) => (
        <div
          key={`${day.label}-${index}`}
          className={`aspect-square rounded-lg border p-1 text-center text-xs ${
            day.valid ? "border-[#b99654] bg-[#b99654]/20 text-white" : day.score > 0 ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/10 text-white" : "border-white/10 bg-black/20 text-[#73695a]"
          }`}
        >
          <div>{day.label}</div>
          <div className="mt-1 text-[10px]">{day.score}%</div>
        </div>
      ))}
    </div>
  );
}
