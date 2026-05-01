"use client";

import { useState } from "react";

export function SocialUsageClient() {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/social-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setMessage(data.message || (response.ok ? "Uso registrado." : "Nao foi possivel registrar."));
  }

  return (
    <div className="auron-panel rounded-2xl p-5">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.24em] text-[#bda889]">Dopamina digital</div>
        <h1 className="text-3xl font-black uppercase">Registro de redes sociais</h1>
        <p className="mt-2 text-sm text-[#c8b99d]">Primeira versao manual: registre tempo por app e, se quiser, um link para print do tempo de tela.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <input name="appName" required placeholder="Instagram, TikTok, YouTube..." className="field" />
        <input name="minutesSpent" required type="number" min={0} placeholder="Minutos" className="field" />
        <input name="usageDate" type="date" className="field" />
        <input name="screenshotUrl" placeholder="URL opcional do print" className="field" />
        <textarea name="notes" placeholder="Observacoes" className="field min-h-28 md:col-span-2" />
        <button className="rounded-xl border border-[#b99654] bg-[#7a1515]/40 px-5 py-3 font-black uppercase md:col-span-2">Registrar uso</button>
      </form>
      {message && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">{message}</div>}
    </div>
  );
}
