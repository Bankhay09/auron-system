"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { ProgressionGraph } from "@/components/charts/ProgressionGraph";
import { PlayerStatusCard } from "@/components/PlayerStatusCard";
import { useAuronSystem } from "@/lib/auron-engine";

export default function OverviewPage() {
  const system = useAuronSystem();
  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <PlayerStatusCard player={system.player} />
        <SystemWindow title="Consolidated Performance"><ProgressionGraph data={system.monthlyPerformance} /></SystemWindow>
      </div>
    </AppShell>
  );
}
