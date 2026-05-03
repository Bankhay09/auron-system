"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ArchitectSprite } from "./ArchitectSprite";
import { ArchitectSpeech } from "./ArchitectSpeech";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

const emptyDirective = [
  "Sistema ativo. Sua execucao sera observada.",
  "Nao confunda motivacao com compromisso. Mostre dados, nao promessas."
];

export function ArchitectPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/architect/chat", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMessages(data?.messages ?? []))
      .catch(() => setError("Nao foi possivel carregar os relatorios do Arquiteto."));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/architect/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.message || "O Arquiteto ficou em silencio por um instante. Tente novamente.");
      return;
    }
    setMessages((current) => [...current, ...(data.messages ?? [])]);
    setContent("");
  }

  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant")?.content;

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="auron-panel rounded-3xl p-4 sm:p-5">
        <ArchitectSprite size="large" contained className="mx-auto w-full" />
        <ArchitectSpeech messages={latestAssistant ? [latestAssistant] : emptyDirective} className="mt-4" />
      </aside>

      <section className="auron-panel flex min-h-[36rem] flex-col rounded-3xl p-4 sm:p-5">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.26em] text-[var(--auron-primary)]">Historico estrategico</div>
          <h2 className="mt-1 text-2xl font-black uppercase text-white">Relatorios e comandos</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="grid gap-3">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-[var(--auron-primary)]/30 bg-[var(--auron-primary)]/10 p-4 text-sm leading-6 text-[#d7f7ff]">
                Nenhum relatorio registrado ainda. Envie um relato, uma duvida ou uma decisao. O Arquiteto respondera como analise estrategica, nao como conversa casual.
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-4 border-white/10 bg-white/[0.04] text-white sm:ml-14"
                    : "mr-4 border-[var(--auron-primary)]/35 bg-[var(--auron-primary)]/10 text-[#d7f7ff] sm:mr-14"
                }`}
              >
                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#a9dfff]">
                  {message.role === "user" ? "Jogador" : "Relatorio do Arquiteto"}
                </div>
                {message.content}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <form onSubmit={send} className="mt-4 grid gap-3">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1200}
            className="field min-h-28"
            placeholder="Registre uma duvida, decisao ou falha de execucao..."
          />
          {error && <div className="rounded-xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-3 text-sm text-[#ffd6c9]">{error}</div>}
          <button disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--auron-primary)] bg-[var(--auron-primary)]/10 px-4 font-black uppercase text-white shadow-neon disabled:opacity-50">
            <Send className="h-4 w-4" />
            {loading ? "Analisando..." : "Enviar ao Arquiteto"}
          </button>
        </form>
      </section>
    </div>
  );
}
