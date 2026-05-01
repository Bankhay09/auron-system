"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuronSystem } from "@/lib/auron-engine";

export default function SettingsPage() {
  const system = useAuronSystem();
  const debugState = system.getDebugState();

  async function reset() {
    const ok = window.confirm("Resetar todo o Auron System? Isso apaga XP, moedas, historico, quests e graficos.");
    if (!ok) return;
    await system.resetSystem();
  }

  return (
    <AppShell>
      <div className="grid gap-4">
        <SystemWindow title="Settings">
          <div className="grid gap-4">
            <ThemeSwitcher />
            <div className="rounded-xl border border-[var(--auron-danger)]/60 bg-[var(--auron-danger)]/10 p-4">
              <div className="text-lg font-black uppercase">Zona de reset</div>
              <p className="mt-1 text-sm text-[#a9dfff]">Apaga os registros do usuario no Supabase e volta o player para zero.</p>
              <button onClick={reset} className="mt-4 rounded-lg border border-[var(--auron-danger)] px-4 py-2 font-black text-white">
                Resetar sistema
              </button>
            </div>
          </div>
        </SystemWindow>
        <SystemWindow title="Debug // Supabase snapshot">
          <pre className="max-h-[34rem] overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-5 text-[#d8f7ff]">
            {debugState}
          </pre>
        </SystemWindow>
      </div>
    </AppShell>
  );
}
