"use client";

import { useEffect, useMemo, useState } from "react";
import { ArchitectCard } from "./ArchitectCard";
import { useCurrentUser } from "@/lib/use-current-user";

type DiaryEntry = {
  id?: string;
  entry_date: string;
  content: string;
  mood: number;
  progress: number;
  tags: string[];
};

export function DiaryClient() {
  const { user } = useCurrentUser();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(5);
  const [progress, setProgress] = useState(50);
  const [tags, setTags] = useState("disciplina, clareza");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [architect, setArchitect] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/diary").then((res) => (res.ok ? res.json() : null)).then((data) => setEntries(data?.entries ?? [])).catch(() => setEntries([]));
  }, []);

  const metrics = useMemo(() => buildMetrics(entries), [entries]);

  async function save() {
    setMessage("");
    const payload = { content, mood, progress, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    const response = await fetch("/api/diary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Nao foi possivel salvar o diario.");
      return;
    }
    localStorage.setItem(`auron-diary:${user?.id || "local"}:${new Date().toISOString().slice(0, 10)}`, "true");
    setEntries((current) => [data.entry, ...current.filter((entry) => entry.entry_date !== data.entry.entry_date)]);
    const ai = await fetch("/api/architect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diaryEntryId: data.entry.id, content }) });
    const aiData = await ai.json();
    if (ai.ok) setArchitect(aiData.architect);
    setMessage("Diario salvo. Check-in diario liberado.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <section className="auron-panel rounded-2xl p-4">
        <h2 className="text-lg font-black uppercase">Metricas</h2>
        <Metric label="Dias concluidos" value={metrics.days} />
        <Metric label="Sequencia atual" value={metrics.currentStreak} />
        <Metric label="Maior sequencia" value={metrics.bestStreak} />
        <Metric label="Media de humor" value={metrics.averageMood.toFixed(1)} />
        <Metric label="Dias positivos" value={metrics.positiveDays} />
        <Metric label="Dias negativos" value={metrics.negativeDays} />
      </section>
      <section className="auron-panel rounded-2xl p-5">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.24em] text-[#bda889]">Diario estoico</div>
          <h1 className="text-3xl font-black uppercase text-white">Exame do dia</h1>
          <p className="mt-2 text-sm leading-6 text-[#c8b99d]">Como Marco Aurelio: menos desculpas, mais observacao. Escreva antes de concluir o dia.</p>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="field min-h-64" placeholder="O que controlei hoje? Onde falhei? Qual ato prova que estou evoluindo?" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-[#bda889]">Humor
            <input type="number" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="field mt-2" />
          </label>
          <label className="text-sm text-[#bda889]">Progresso %
            <input type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="field mt-2" />
          </label>
          <label className="text-sm text-[#bda889]">Tags
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="field mt-2" />
          </label>
        </div>
        {message && <div className="mt-4 rounded-xl border border-[#b99654]/50 bg-[#b99654]/10 p-3 text-sm">{message}</div>}
        <button onClick={save} className="mt-4 rounded-xl border border-[#b99654] bg-[#7a1515]/40 px-5 py-3 font-black uppercase">Salvar diario e chamar Arquiteto</button>
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-black uppercase">Historico</h2>
          <div className="grid gap-3">
            {entries.slice(0, 8).map((entry) => (
              <article key={entry.id || entry.entry_date} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <div className="font-black text-white">{entry.entry_date} · Humor {entry.mood}/10 · {entry.progress}%</div>
                <p className="mt-2 line-clamp-3 text-[#c8b99d]">{entry.content}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <ArchitectCard response={architect} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs uppercase text-[#bda889]">{label}</div>
    </div>
  );
}

function buildMetrics(entries: DiaryEntry[]) {
  const days = entries.length;
  const averageMood = days ? entries.reduce((sum, entry) => sum + Number(entry.mood || 0), 0) / days : 0;
  const positiveDays = entries.filter((entry) => entry.mood >= 7).length;
  const negativeDays = entries.filter((entry) => entry.mood <= 4).length;
  return { days, averageMood, positiveDays, negativeDays, currentStreak: days, bestStreak: days };
}
