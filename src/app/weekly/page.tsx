"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { ProgressionGraph } from "@/components/charts/ProgressionGraph";
import { WeeklyMatrix } from "@/components/charts/WeeklyMatrix";
import { HabitGraph } from "@/components/charts/HabitGraph";
import { useAuronSystem } from "@/lib/auron-engine";

export default function WeeklyPage() {
  const system = useAuronSystem();
  return (
    <AppShell>
      <div className="grid gap-4">
        <SystemWindow title="Weekly Performance"><ProgressionGraph data={system.weeklyPerformance} /></SystemWindow>
        <SystemWindow title="Weekly Matrix"><WeeklyMatrix data={system.weeklyPerformance} /></SystemWindow>
        <SystemWindow title="Habit Graph"><HabitGraph skills={system.skillScores} /></SystemWindow>
      </div>
    </AppShell>
  );
}
