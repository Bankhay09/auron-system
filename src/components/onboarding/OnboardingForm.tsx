"use client";

import { useState } from "react";

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [data, setData] = useState({
    mainGoal: "",
    currentSituation: "",
    habitsToAbandon: [] as string[],
    habitsToImplement: [] as string[]
  });

  async function finish() {
    setMessage("");
    if (data.habitsToImplement.length < 4) {
      setMessage("Você precisa inserir pelo menos 4 hábitos para continuar.");
      return;
    }
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || "Nao foi possivel concluir o onboarding.");
      return;
    }
    window.location.href = result.redirectTo || "/dashboard";
  }

  function next() {
    if ((step === 2 && data.habitsToAbandon.length < 4) || (step === 3 && data.habitsToImplement.length < 4)) {
      setMessage("Você precisa inserir pelo menos 4 hábitos para continuar.");
      return;
    }
    setMessage("");
    setStep((value) => value + 1);
  }

  return (
    <div className="auron-panel mx-auto max-w-3xl rounded-2xl p-6">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-[#bda889]">Arquitetura inicial</div>
        <h1 className="mt-2 text-4xl font-black uppercase text-white">Antes do sistema abrir</h1>
        <p className="mt-2 text-[#bda889]">Escreva manualmente seus pactos. O sistema recusara entradas nocivas ou invalidas.</p>
      </div>
      {step === 0 && (
        <Panel title="Objetivo principal">
          <textarea value={data.mainGoal} onChange={(e) => setData({ ...data, mainGoal: e.target.value })} className="field min-h-36" placeholder="Ex: desenvolver disciplina, estudar Java e construir uma rotina consistente." />
        </Panel>
      )}
      {step === 1 && (
        <Panel title="Situacao atual">
          <textarea value={data.currentSituation} onChange={(e) => setData({ ...data, currentSituation: e.target.value })} className="field min-h-36" placeholder="Descreva sua realidade sem enfeitar." />
        </Panel>
      )}
      {step === 2 && (
        <Panel title="Habitos que deseja abandonar">
          <HabitCardList value={data.habitsToAbandon} onChange={(habitsToAbandon) => setData({ ...data, habitsToAbandon })} placeholder="Digite um hábito que quer abandonar" />
        </Panel>
      )}
      {step === 3 && (
        <Panel title="Habitos que deseja implementar">
          <HabitCardList value={data.habitsToImplement} onChange={(habitsToImplement) => setData({ ...data, habitsToImplement })} placeholder="Digite um hábito que quer implementar" />
        </Panel>
      )}
      {message && <div className="mt-4 rounded-xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-3 text-sm">{message}</div>}
      <div className="mt-6 flex justify-between gap-3">
        <button disabled={step === 0} onClick={() => setStep((value) => value - 1)} className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40">Voltar</button>
        <button onClick={step === 3 ? finish : next} className="rounded-xl border border-[#b99654] bg-[#7a1515]/40 px-5 py-2 font-black uppercase">
          {step === 3 ? "Liberar dashboard" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

function HabitCardList({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function add() {
    const habit = draft.trim();
    if (!habit) return;
    if (!isHabitValid(habit)) {
      setError("Esse hábito não é válido para desenvolvimento pessoal.");
      return;
    }
    setError("");
    onChange([...value, habit]);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[#a9dfff]">Escreva seus próprios hábitos. Mínimo obrigatório: 4.</p>
        <div className={`rounded-full border px-3 py-1 text-sm font-black ${value.length >= 4 ? "border-[var(--auron-success)] text-[var(--auron-success)]" : "border-[var(--auron-danger)] text-[#ffd6c9]"}`}>
          {value.length}/4
        </div>
      </div>
      <div className="grid gap-3">
        {value.map((habit, index) => (
          <div key={`${habit}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--auron-primary)]/30 bg-black/30 p-3 shadow-[0_0_18px_rgba(0,240,255,0.08)]">
            <span className="text-sm text-white">{habit}</span>
            <button onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--auron-danger)]/50 text-[#ffd6c9]">
              X
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} className="field" placeholder={placeholder} />
        <button onClick={add} className="rounded-xl border border-[var(--auron-primary)] px-4 font-black text-white shadow-neon">Adicionar</button>
      </div>
      {error && <div className="mt-3 rounded-xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-3 text-sm">{error}</div>}
    </div>
  );
}

function isHabitValid(habit: string) {
  return !/(porn|drog|apostar|beber todos os dias|dormir o dia todo|machucar|crime|suic|autodestru)/i.test(habit);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-black uppercase text-white">{title}</h2>
      {children}
    </section>
  );
}
