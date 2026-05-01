"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { PlayerStatusCard } from "@/components/PlayerStatusCard";
import { AttributeRadar } from "@/components/charts/AttributeRadar";
import { HabitGraph } from "@/components/charts/HabitGraph";
import { WeeklyMatrix } from "@/components/charts/WeeklyMatrix";
import { ProgressionGraph } from "@/components/charts/ProgressionGraph";
import { SystemNotification } from "@/components/notifications/SystemNotification";
import { SystemClock } from "@/components/SystemClock";
import { useAuronSystem } from "@/lib/auron-engine";
import { ArchitectChat } from "@/components/diary/ArchitectChat";
import { DisciplineCalendar } from "@/components/dashboard/DisciplineCalendar";
import { useCurrentUser } from "@/lib/use-current-user";

export function DashboardClient() {
  const { user, loading } = useCurrentUser();
  const system = useAuronSystem({ userId: user?.id, username: user?.username, onboardingData: user?.onboardingData });

  if (loading) {
    return <AppShell><div className="auron-panel rounded-2xl p-6">Carregando jornada do usuario...</div></AppShell>;
  }

  return (
    <AppShell>
      <Header title="Auron System" subtitle="Player Status // Dashboard" />
      {user?.onboardingData?.mainGoal && (
        <div className="auron-panel mb-4 rounded-2xl p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-[#a9dfff]">Objetivo principal</div>
          <div className="mt-1 text-lg font-black text-white">{user.onboardingData.mainGoal}</div>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[330px_minmax(360px,1fr)_360px]">
        <PlayerStatusCard player={system.player} />
        <SystemWindow title="Calendario de Disciplina"><DisciplineCalendar monthly={system.monthlyPerformance} /></SystemWindow>
        <ArchitectChat />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[330px_minmax(360px,1fr)_360px]">
        <SystemWindow title="Attribute Radar"><AttributeRadar data={system.attributes} /></SystemWindow>
        <SystemWindow title="Progression Graph"><ProgressionGraph data={system.weeklyPerformance} /></SystemWindow>
        <div className="grid content-start gap-4">
          <SystemClock completed={system.allCompleted} finalColor={system.finalColor} lastCompletedAt={system.lastCompletedAt} />
          {system.events.slice(0, 3).map((event) => <SystemNotification key={event.id} event={event} />)}
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[330px_1fr]">
        <SystemWindow title="Skill Tracker"><HabitGraph skills={system.skillScores} /></SystemWindow>
        <SystemWindow title="Weekly Matrix"><WeeklyMatrix data={system.weeklyPerformance} /></SystemWindow>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SystemWindow title="Weekly Progress">
          <ProgressPanel value={system.weeklyProgress} label="Score semanal" xp={system.weeklyPerformance.reduce((sum, day) => sum + day.xp, 0)} />
        </SystemWindow>
        <SystemWindow title="Monthly Progress">
          <ProgressPanel value={system.monthlyProgress} label="Score mensal" xp={system.monthlyPerformance.reduce((sum, day) => sum + day.xp, 0)} />
        </SystemWindow>
      </div>
    </AppShell>
  );
}

function ProgressPanel({ value, label, xp }: { value: number; label: string; xp: number }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-4xl font-black">{value}%</div>
          <div className="text-sm text-[#a9dfff]">{label}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black">{xp}</div>
          <div className="text-xs uppercase text-[#a9dfff]">XP aplicado</div>
        </div>
      </div>
      <div className="auron-bar mt-4">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="auron-title text-4xl font-black uppercase md:text-6xl">{title}</h1>
        <p className="mt-2 text-sm uppercase text-[#a9dfff]">{subtitle}</p>
      </div>
    </header>
  );
}
