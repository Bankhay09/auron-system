"use client";

import { useEffect, useState } from "react";
import { useAuronSystem } from "@/lib/auron-engine";
import { XpBar } from "./XpBar";
import { useCurrentUser } from "@/lib/use-current-user";

export function QuestPanel() {
  const { user, loading } = useCurrentUser();
  const { daily, completedTasks, dayProgress, predictedXp, predictedCoins, requiredFailed, allCompleted, toggleHabit, completeQuest, closeDay } = useAuronSystem({ userId: user?.id, username: user?.username, onboardingData: user?.onboardingData });
  const [effect, setEffect] = useState<"idle" | "mark" | "glitch" | "reward" | "xp">("idle");
  const [diaryWritten, setDiaryWritten] = useState(false);

  useEffect(() => {
    if (effect === "idle") return;
    const timer = window.setTimeout(() => setEffect("idle"), effect === "reward" ? 1800 : 900);
    return () => window.clearTimeout(timer);
  }, [effect]);

  useEffect(() => {
    setDiaryWritten(localStorage.getItem(`auron-diary:${user?.id || "local"}:${daily.date}`) === "true");
  }, [daily.date, user?.id]);

  if (loading) {
    return <div className="auron-panel rounded-2xl p-5">Carregando pactos diarios...</div>;
  }

  function markHabit(id: string) {
    if (daily.completed) return;
    toggleHabit(id);
    setEffect("mark");
  }

  function finishQuest() {
    if (!diaryWritten) {
      setEffect("glitch");
      return;
    }
    if (!allCompleted || daily.completed) {
      setEffect("glitch");
      completeQuest();
      return;
    }
    setEffect("reward");
    completeQuest();
  }

  function finishDay() {
    setEffect(allCompleted ? "xp" : "glitch");
    closeDay();
  }

  return (
    <div className={`daily-system-window auron-panel rounded-2xl p-4 sm:p-6 ${effectClass(effect)} ${daily.completed ? "quest-locked" : ""}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="scanline" />
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-[#a9dfff]">Auron System</div>
          <h2 className="auron-title mt-1 text-3xl font-black uppercase sm:text-5xl">Daily Quest</h2>
          <p className="text-sm text-[#a9dfff]">Missao diaria em monitoramento ativo.</p>
        </div>
        <div className="rounded-full border border-[var(--auron-primary)]/60 bg-[var(--auron-primary)]/10 px-4 py-2 text-sm font-black shadow-neon">
          {daily.completed ? "FINALIZADA" : `${dayProgress}% complete`}
        </div>
      </div>
      <XpBar label={`Daily Quest Progress ${completedTasks}/${daily.habits.length}`} value={completedTasks} max={daily.habits.length} />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <RewardPreview label="XP previsto" value={predictedXp} />
        <RewardPreview label="Moedas previstas" value={predictedCoins} />
        <RewardPreview label="XP aplicado" value={daily.totalXp} />
      </div>
      <div className="mt-5 grid gap-3">
        {daily.habits.map((habit) => (
          <button
            key={habit.id}
            disabled={daily.completed}
            onClick={() => markHabit(habit.id)}
            className={`quest-row group rounded-xl border p-4 text-left transition ${
              habit.completed
                ? "is-complete border-[var(--auron-success)] bg-[var(--auron-success)]/10 shadow-[0_0_22px_rgba(47,255,210,0.2)]"
                : "border-white/10 bg-white/[0.04] hover:border-[var(--auron-primary)] hover:bg-[var(--auron-primary)]/10"
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-black">{habit.name}</div>
                <div className="text-xs text-[#a9dfff]">
                  {habit.currentValue}/{habit.targetValue} {habit.targetUnit} · {habit.xpReward} XP · {habit.required ? "Main quest" : "Side quest"}
                </div>
              </div>
              <div className="rounded-full border border-white/15 px-3 py-1 text-xs font-black">
                {daily.completed ? "LOCKED" : habit.completed ? "COMPLETE" : "ACTIVE"}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className={`mt-5 rounded-xl border p-4 ${requiredFailed ? "border-[var(--auron-danger)] bg-[var(--auron-danger)]/10" : "border-[var(--auron-success)] bg-[var(--auron-success)]/10"}`}>
        {daily.completed ? "SYSTEM: Daily Quest finalizada. Tarefas bloqueadas ate o proximo dia." : !diaryWritten ? "WARNING: escreva o diario estoico antes de concluir o dia." : requiredFailed ? "WARNING: missoes principais ainda abertas." : "REWARD: missao diaria pronta para conclusao."}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={finishQuest} disabled={daily.completed} className="system-button rounded-lg border border-[var(--auron-primary)] px-4 py-2 font-black shadow-neon disabled:cursor-not-allowed disabled:opacity-40">
          Completar Quest
        </button>
        <button onClick={finishDay} disabled={daily.completed} className="system-button-danger rounded-lg border border-[var(--auron-danger)] px-4 py-2 font-black disabled:cursor-not-allowed disabled:opacity-40">
          Encerrar Dia
        </button>
      </div>
      {effect === "reward" && <div className="reward-burst">REWARD ACQUIRED</div>}
      {effect === "glitch" && <div className="glitch-alert">QUEST INCOMPLETA</div>}
    </div>
  );
}

function RewardPreview({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs uppercase text-[#a9dfff]">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function effectClass(effect: "idle" | "mark" | "glitch" | "reward" | "xp") {
  if (effect === "mark") return "quest-mark-pulse";
  if (effect === "glitch") return "quest-glitch";
  if (effect === "reward") return "quest-reward";
  if (effect === "xp") return "quest-xp";
  return "";
}
