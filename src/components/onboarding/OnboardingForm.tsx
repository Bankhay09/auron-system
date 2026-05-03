"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArchitectSprite } from "@/components/architect/ArchitectSprite";
import { ArchitectSpeech } from "@/components/architect/ArchitectSpeech";

type OnboardingPayload = {
  mainGoal: string;
  currentSituation: string;
  habitsToAbandon: string[];
  habitsToImplement: string[];
  diagnosis: Record<string, number>;
  routine: {
    days: string[];
    preferredWindow: string;
    minimumDailyAction: string;
  };
  commitmentLevel: string;
};

const steps = [
  "Sistema Auron detectado",
  "Diagnostico inicial",
  "Objetivo principal",
  "Padroes a abandonar",
  "Habitos a implementar",
  "Rotina e frequencia",
  "Nivel de compromisso",
  "Analise concluida",
  "Despertar iniciado"
];

const diagnosisCards = [
  ["disciplina", "Disciplina"],
  ["fisico", "Fisico"],
  ["foco", "Foco"],
  ["rotina", "Rotina"],
  ["energia", "Sono / energia"]
] as const;

const weekDays = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

const speechByStep = [
  [
    "Sistema Auron detectado.",
    "Eu sou o Arquiteto. A partir daqui, sua evolucao sera medida por execucao, nao intencao."
  ],
  ["Responda com precisao. Dados imprecisos geram evolucao falha."],
  ["Nomeie o objetivo. O sistema nao pode conduzir uma promessa vaga."],
  ["Identifique os padroes que drenam sua execucao. O sistema nao corrige o que voce se recusa a nomear."],
  ["Agora defina os pactos que sustentarao sua evolucao diaria."],
  ["Frequencia define evolucao. Escolha uma rotina que voce realmente consiga sustentar."],
  ["Declare seu nivel de seriedade. O sistema adaptara a pressao ao seu compromisso."],
  ["Analise concluida. Seu nivel atual foi classificado."],
  ["Todo jogador comeca no Rank E. O diferencial sera sua persistencia."]
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingPayload>({
    mainGoal: "",
    currentSituation: "",
    habitsToAbandon: [],
    habitsToImplement: [],
    diagnosis: {
      disciplina: 2,
      fisico: 2,
      foco: 2,
      rotina: 2,
      energia: 2
    },
    routine: {
      days: ["seg", "qua", "sex"],
      preferredWindow: "manha",
      minimumDailyAction: ""
    },
    commitmentLevel: "comprometido"
  });

  const analysis = useMemo(() => buildAnalysis(data), [data]);
  const routineFeedback = useMemo(() => buildRoutineFeedback(data.routine.days.length), [data.routine.days.length]);

  function next() {
    const validation = validateStep(step, data);
    if (validation) {
      setMessage(validation);
      return;
    }
    setMessage("");
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  function back() {
    setMessage("");
    setStep((value) => Math.max(0, value - 1));
  }

  async function finish() {
    const validation = validateFinal(data);
    if (validation) {
      setMessage(validation);
      return;
    }
    setSaving(true);
    const payload = {
      ...data,
      currentSituation: buildSituation(data),
      initialRank: "E",
      architectAnalysis: analysis
    };
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(result.message || "Nao foi possivel concluir o onboarding.");
      return;
    }
    router.push(result.redirectTo || "/dashboard");
  }

  async function cancel() {
    setSaving(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setSaving(false);
    router.push("/login");
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-6">
      <div className="mb-5 grid gap-2 sm:grid-cols-9">
        {steps.map((label, index) => (
          <div key={label} className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--auron-primary)] shadow-neon" : "bg-white/10"}`} />
        ))}
      </div>

      <div className="auron-panel relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <span className="scanline" />
        </div>
        <div className="relative">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-[var(--auron-primary)]">Auron System // Entry Protocol</div>
              <h1 className="auron-title mt-2 text-3xl font-black uppercase sm:text-5xl">{steps[step]}</h1>
            </div>
            <div className="rounded-full border border-[var(--auron-primary)]/50 bg-[var(--auron-primary)]/10 px-4 py-2 text-sm font-black text-white">
              {step + 1}/9
            </div>
          </div>

          <ArchitectStage messages={speechByStep[step]}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.985 }}
                transition={{ duration: 0.24 }}
              >
                {step === 0 && <IntroStep />}
                {step === 1 && <DiagnosisStep data={data} setData={setData} />}
                {step === 2 && <GoalStep data={data} setData={setData} />}
                {step === 3 && <HabitStep title="Habitos que deseja abandonar" value={data.habitsToAbandon} onChange={(habitsToAbandon) => setData({ ...data, habitsToAbandon })} placeholder="Digite um padrao a abandonar" />}
                {step === 4 && <HabitStep title="Habitos que deseja implementar" value={data.habitsToImplement} onChange={(habitsToImplement) => setData({ ...data, habitsToImplement })} placeholder="Digite um pacto de evolucao" />}
                {step === 5 && <RoutineStep data={data} setData={setData} feedback={routineFeedback} />}
                {step === 6 && <CommitmentStep data={data} setData={setData} />}
                {step === 7 && <ResultStep analysis={analysis} />}
                {step === 8 && <ConfirmStep data={data} analysis={analysis} />}
              </motion.div>
            </AnimatePresence>
            {reactionForStep(step, data) && (
              <div className="mt-5 rounded-2xl border border-[var(--auron-primary)]/25 bg-[var(--auron-primary)]/8 p-3 text-sm text-[#d7f7ff]">
                {reactionForStep(step, data)}
              </div>
            )}
          </ArchitectStage>

          {message && <div className="mt-5 rounded-xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-3 text-sm text-[#ffd6c9]">{message}</div>}

          <div className="mt-7 flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <button disabled={step === 0 || saving} onClick={back} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black uppercase text-white disabled:opacity-40">
                Voltar
              </button>
              <button disabled={saving} onClick={cancel} className="rounded-xl border border-[var(--auron-danger)]/50 px-4 py-2 text-sm font-black uppercase text-[#ffd6c9]">
                Sair
              </button>
            </div>
            <button onClick={step === 8 ? finish : next} disabled={saving} className="rounded-xl border border-[var(--auron-primary)] bg-[var(--auron-primary)]/12 px-5 py-2 text-sm font-black uppercase text-white shadow-neon disabled:opacity-50">
              {saving ? "Sincronizando..." : step === 0 ? "Iniciar analise" : step === 8 ? "Liberar Dashboard" : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectStage({ messages, children }: { messages: string[]; children: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="order-2 min-w-0 lg:order-1">{children}</div>
      <aside className="order-1 grid content-start gap-4 lg:sticky lg:top-6 lg:order-2">
        <ArchitectSprite size="medium" contained className="w-full" />
        <ArchitectSpeech messages={messages} />
      </aside>
    </div>
  );
}

function IntroStep() {
  return (
    <section className="rounded-2xl border border-[var(--auron-primary)]/35 bg-black/25 p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--auron-primary)]">Entrada no sistema</div>
      <h2 className="mt-2 text-3xl font-black uppercase text-white">A evolucao comeca quando a rotina vira evidência.</h2>
      <p className="mt-4 max-w-2xl leading-7 text-[#d7f7ff]">
        O Auron System vai mapear seus pactos, registrar sua execucao e transformar progresso real em XP, rank e diagnostico. O Arquiteto nao mede intencao. Ele mede continuidade.
      </p>
    </section>
  );
}

function DiagnosisStep({ data, setData }: StepProps) {
  return (
    <section>
      <PanelTitle eyebrow="Diagnostico" title="Classifique sua estrutura atual." />
      <div className="grid gap-3 sm:grid-cols-2">
        {diagnosisCards.map(([key, label]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 font-black uppercase text-white">{label}</div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setData({ ...data, diagnosis: { ...data.diagnosis, [key]: value } })}
                  className={`grid h-10 place-items-center rounded-lg border text-sm font-black ${data.diagnosis[key] === value ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/20 text-white shadow-neon" : "border-white/10 bg-white/[0.04] text-[#a9dfff]"}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoalStep({ data, setData }: StepProps) {
  return (
    <section>
      <PanelTitle eyebrow="Objetivo" title="Escreva o objetivo principal." />
      <textarea
        value={data.mainGoal}
        onChange={(event) => setData({ ...data, mainGoal: event.target.value })}
        className="field min-h-48 text-base"
        placeholder="Ex: dominar Java, treinar com consistencia, melhorar sono e reduzir impulsos digitais."
      />
    </section>
  );
}

function HabitStep({ title, value, onChange, placeholder }: { title: string; value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  return (
    <section>
      <PanelTitle eyebrow="Pactos" title={title} />
      <HabitCardList value={value} onChange={onChange} placeholder={placeholder} />
    </section>
  );
}

function RoutineStep({ data, setData, feedback }: StepProps & { feedback: string }) {
  return (
    <section className="grid gap-5">
      <PanelTitle eyebrow="Rotina" title="Escolha frequencia e janela de execucao." />
      <div className="grid gap-2 sm:grid-cols-7">
        {weekDays.map((day) => {
          const active = data.routine.days.includes(day);
          return (
            <button
              key={day}
              onClick={() => setData({ ...data, routine: { ...data.routine, days: toggle(data.routine.days, day) } })}
              className={`rounded-xl border p-4 text-center text-sm font-black uppercase ${active ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/18 text-white shadow-neon" : "border-white/10 bg-white/[0.04] text-[#a9dfff]"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <OptionGroup
        label="Janela preferida"
        value={data.routine.preferredWindow}
        options={["manha", "tarde", "noite", "madrugada"]}
        onChange={(preferredWindow) => setData({ ...data, routine: { ...data.routine, preferredWindow } })}
      />
      <input
        value={data.routine.minimumDailyAction}
        onChange={(event) => setData({ ...data, routine: { ...data.routine, minimumDailyAction: event.target.value } })}
        className="field"
        placeholder="Acao minima diaria quando o dia estiver dificil"
      />
      <div className="rounded-2xl border border-[var(--auron-primary)]/35 bg-[var(--auron-primary)]/10 p-4 text-sm text-[#d7f7ff]">{feedback}</div>
    </section>
  );
}

function CommitmentStep({ data, setData }: StepProps) {
  const options = [
    ["tentar", "Quero tentar", "Pressao baixa. O sistema prioriza continuidade minima."],
    ["comprometido", "Estou comprometido", "Pressao ideal. Rotina firme com margem de ajuste."],
    ["tudo", "Vou dar tudo", "Alta exigencia. Risco de sobrecarga sera monitorado."],
    ["monarca", "Modo monarca", "Compromisso maximo. O sistema tratara falhas como sinais criticos."]
  ];
  return (
    <section>
      <PanelTitle eyebrow="Compromisso" title="Escolha o nivel de seriedade." />
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(([value, label, description]) => (
          <button
            key={value}
            onClick={() => setData({ ...data, commitmentLevel: value })}
            className={`rounded-2xl border p-4 text-left transition ${data.commitmentLevel === value ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/18 shadow-neon" : "border-white/10 bg-white/[0.04] hover:border-[var(--auron-primary)]/45"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-black uppercase text-white">{label}</div>
              {data.commitmentLevel === value && <Check className="h-5 w-5 text-[var(--auron-primary)]" />}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#a9dfff]">{description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultStep({ analysis }: { analysis: string }) {
  return (
    <section className="grid gap-5 md:grid-cols-[280px_1fr]">
      <div className="rounded-2xl border border-[var(--auron-primary)]/45 bg-black/30 p-6 text-center">
        <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border-4 border-[var(--auron-primary)] bg-[var(--auron-primary)]/10 text-6xl font-black text-white shadow-neon">E</div>
        <div className="mt-4 text-xs uppercase tracking-[0.24em] text-[#a9dfff]">Rank inicial</div>
        <div className="text-2xl font-black text-white">Awakening Player</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--auron-primary)]">Analise do Arquiteto</div>
        <h2 className="mt-2 text-2xl font-black uppercase text-white">Todo jogador comeca no Rank E.</h2>
        <p className="mt-4 leading-7 text-[#d7f7ff]">{analysis}</p>
      </div>
    </section>
  );
}

function ConfirmStep({ data, analysis }: { data: OnboardingPayload; analysis: string }) {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <SummaryCard title="Objetivo" value={data.mainGoal || "Nao definido"} />
      <SummaryCard title="Pactos ativos" value={`${data.habitsToImplement.length} habitos`} />
      <SummaryCard title="Padroes mapeados" value={`${data.habitsToAbandon.length} ameacas`} />
      <div className="lg:col-span-3 rounded-2xl border border-[var(--auron-success)]/40 bg-[var(--auron-success)]/10 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[var(--auron-success)]" />
          <h2 className="text-2xl font-black uppercase text-white">Despertar iniciado</h2>
        </div>
        <p className="mt-3 leading-7 text-[#d7f7ff]">{analysis}</p>
      </div>
    </section>
  );
}

function HabitCardList({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function add() {
    const habit = draft.trim();
    if (!habit) return;
    if (!isHabitValid(habit)) {
      setError("Esse habito nao pode ser usado no sistema. Escolha uma entrada voltada para evolucao pessoal.");
      return;
    }
    if (value.some((item) => item.toLowerCase() === habit.toLowerCase())) {
      setError("Esse habito ja foi inserido.");
      return;
    }
    setError("");
    onChange([...value, habit]);
    setDraft("");
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-[#a9dfff]">Escreva manualmente. Minimo obrigatorio: 4.</p>
        <div className={`rounded-full border px-3 py-1 text-sm font-black ${value.length >= 4 ? "border-[var(--auron-success)] text-[var(--auron-success)]" : "border-[var(--auron-danger)] text-[#ffd6c9]"}`}>
          {value.length}/4
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((habit, index) => (
          <motion.div
            key={`${habit}-${index}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--auron-primary)]/35 bg-[var(--auron-primary)]/10 px-3 py-2 text-sm text-white"
          >
            <span>{habit}</span>
            <button onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="text-[#ffd6c9]" aria-label={`Remover ${habit}`}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className="field"
          placeholder={placeholder}
        />
        <button onClick={add} className="grid min-h-11 w-12 place-items-center rounded-xl border border-[var(--auron-primary)] font-black text-white shadow-neon" aria-label="Adicionar habito">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {error && <div className="mt-3 rounded-xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-3 text-sm text-[#ffd6c9]">{error}</div>}
    </div>
  );
}

function OptionGroup({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#a9dfff]">{label}</div>
      <div className="grid gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-xl border p-3 text-center text-sm font-black uppercase transition ${value === option ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/15 text-white shadow-neon" : "border-white/10 bg-white/[0.04] text-[#d7ecff] hover:border-[var(--auron-primary)]/50"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--auron-primary)]">{eyebrow}</div>
      <h2 className="mt-1 text-2xl font-black uppercase text-white">{title}</h2>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-[#a9dfff]">{title}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function validateStep(step: number, data: OnboardingPayload) {
  if (step === 2 && data.mainGoal.trim().length < 12) return "Defina um objetivo principal com mais clareza.";
  if (step === 3 && data.habitsToAbandon.length < 4) return "Voce precisa inserir pelo menos 4 habitos para continuar.";
  if (step === 4 && data.habitsToImplement.length < 4) return "Voce precisa inserir pelo menos 4 habitos para continuar.";
  if (step === 5 && data.routine.days.length < 2) return "Escolha pelo menos 2 dias da semana para continuar.";
  return "";
}

function validateFinal(data: OnboardingPayload) {
  if (data.mainGoal.trim().length < 12) return "Defina um objetivo principal com mais clareza.";
  if (data.habitsToAbandon.length < 4 || data.habitsToImplement.length < 4) return "Voce precisa inserir pelo menos 4 habitos para continuar.";
  return "";
}

function buildSituation(data: OnboardingPayload) {
  const scores = diagnosisCards.map(([key, label]) => `${label}: ${data.diagnosis[key]}/5`).join("; ");
  return `Diagnostico inicial. ${scores}. Janela preferida: ${data.routine.preferredWindow}. Frequencia: ${data.routine.days.join(", ")}. Compromisso: ${data.commitmentLevel}.`;
}

function buildAnalysis(data: OnboardingPayload) {
  const average = diagnosisCards.reduce((sum, [key]) => sum + Number(data.diagnosis[key] || 0), 0) / diagnosisCards.length;
  const commitment = {
    tentar: "pressao baixa",
    comprometido: "pressao estavel",
    tudo: "alta exigencia",
    monarca: "protocolo maximo"
  }[data.commitmentLevel] || "pressao estavel";
  if (average <= 2) {
    return `Rank E atribuido. Base fragil detectada, mas isso e ponto de partida, nao sentenca. O sistema iniciara com ${commitment} e foco em ciclos pequenos de execucao.`;
  }
  if (average >= 4) {
    return `Rank E atribuido. Estrutura inicial acima da media detectada. O sistema recomenda preservar consistencia antes de elevar carga. Compromisso: ${commitment}.`;
  }
  return `Rank E atribuido. Estrutura intermediaria detectada. O diferencial sera repeticao, diario e fechamento das missoes. Compromisso: ${commitment}.`;
}

function buildRoutineFeedback(days: number) {
  if (days <= 2) return "Frequencia baixa. Evolucao sera lenta, mas pode ser sustentavel se o ciclo for protegido.";
  if (days <= 5) return "Rotina estavel detectada. Frequencia suficiente para evolucao sem sobrecarga extrema.";
  return "Risco de sobrecarga detectado. O sistema recomenda preservar descanso estrategico.";
}

function reactionForStep(step: number, data: OnboardingPayload) {
  if (step === 2 && data.mainGoal.trim().length >= 12) return "Objetivo nomeado. Agora ele pode ser medido.";
  if (step === 3 && data.habitsToAbandon.length >= 4) return "Ameacas mapeadas. O sistema ja sabe onde a disciplina costuma vazar.";
  if (step === 4 && data.habitsToImplement.length >= 4) return "Pactos registrados. A Daily Quest sera gerada a partir deles.";
  if (step === 5) return buildRoutineFeedback(data.routine.days.length);
  if (step === 6) return "Compromisso aceito. A pressao sera aplicada com seguranca e continuidade.";
  return "";
}

function isHabitValid(habit: string) {
  return !/(porn|drog|apost|beber todos os dias|dormir o dia todo|machucar|crime|suic|autodestru|matar|roubar|fraude|violenc|odio)/i.test(habit);
}

function toggle(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

type StepProps = {
  data: OnboardingPayload;
  setData: (data: OnboardingPayload) => void;
};
