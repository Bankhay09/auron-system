"use client";

import { useEffect, useRef, useState } from "react";
import { ArchitectCard } from "./ArchitectCard";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export function ArchitectChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/architect/chat")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMessages(data?.messages ?? []))
      .catch(() => setError("Nao foi possivel carregar o Arquiteto."));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/architect/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.message || "O Arquiteto ficou em silencio por um instante. Tente novamente.");
      return;
    }
    setMessages((current) => [...current, ...data.messages]);
    setContent("");
  }

  return (
    <aside className="auron-panel flex max-h-[760px] min-h-[620px] flex-col rounded-2xl p-4">
      <ArchitectCard />
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="grid gap-3">
          {messages.map((message) => (
            <div key={message.id} className={`rounded-xl border p-3 text-sm leading-6 ${message.role === "user" ? "ml-8 border-[#b99654]/40 bg-[#7a1515]/20 text-white" : "mr-8 border-white/10 bg-black/25 text-[#d8cbb6]"}`}>
              {message.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <form onSubmit={send} className="mt-3 grid gap-2">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={1200} className="field min-h-24" placeholder="Fale com o Arquiteto..." />
        {error && <div className="rounded-lg border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-2 text-xs">{error}</div>}
        <button disabled={loading} className="rounded-xl border border-[#b99654] bg-[#7a1515]/40 px-4 py-3 font-black uppercase disabled:opacity-50">
          {loading ? "Consultando..." : "Enviar"}
        </button>
      </form>
    </aside>
  );
}
