import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { monthlyPerformance } from "@/data/mock-data";

export default function MonthlyPage() {
  return (
    <AppShell>
      <SystemWindow title="Monthly Performance">
        <div className="grid grid-cols-7 gap-2">
          {monthlyPerformance.map((day) => (
            <div key={day.label} className={`grid min-h-14 place-items-center rounded-lg border text-sm ${day.valid ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/20" : "border-white/10 bg-white/[0.04]"}`}>
              <span className="text-[#c9b9dc]">{day.label}</span>
              <strong>{day.score}</strong>
            </div>
          ))}
        </div>
      </SystemWindow>
    </AppShell>
  );
}

