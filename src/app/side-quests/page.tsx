"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { useCurrentUser } from "@/lib/use-current-user";

export default function SideQuestsPage() {
  const { user, loading } = useCurrentUser();
  const quests = buildSideQuests(user?.onboardingData);

  return (
    <AppShell>
      <SystemWindow title="Side Quests">
        {loading ? (
          <div>Carregando side quests...</div>
        ) : (
          <div className="grid gap-3">
            {quests.map((quest, index) => (
              <div key={quest} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="font-black">{quest}</div>
                <div className="mt-1 text-sm text-[#a9dfff]">Progress {index === 0 ? 0 : 1}/7 · XP extra disponivel</div>
              </div>
            ))}
          </div>
        )}
      </SystemWindow>
    </AppShell>
  );
}

function buildSideQuests(onboarding?: { mainGoal?: string; currentSituation?: string; habitsToAbandon?: string[]; habitsToImplement?: string[] }) {
  const implement = normalizeList(onboarding?.habitsToImplement);
  const abandon = normalizeList(onboarding?.habitsToAbandon);
  const quests = [
    ...implement.slice(0, 4).map((habit) => `Manter "${habit}" por 5 dias`),
    ...abandon.slice(0, 4).map((habit) => `Evitar "${habit}" por 7 dias`)
  ];
  if (onboarding?.mainGoal) quests.unshift(`Avancar no objetivo: ${onboarding.mainGoal.slice(0, 80)}`);
  if (onboarding?.currentSituation) quests.push("Registrar uma acao concreta contra a situacao atual");
  return quests.length ? quests : ["Complete o onboarding para gerar side quests pessoais"];
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  return [];
}
