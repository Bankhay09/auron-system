"use client";

import { useEffect, useState } from "react";
import { applyTheme, themePresets, type ThemeName } from "@/lib/theme-presets";
import { useCurrentUser } from "@/lib/use-current-user";

const labels: Record<ThemeName, string> = {
  cyan: "Ciano HUD",
  gold: "Dourado antigo",
  blood: "Vermelho profundo",
  violet: "Violeta arcano"
};

export function ThemeSwitcher() {
  const { user } = useCurrentUser();
  const [selected, setSelected] = useState<ThemeName>("cyan");

  useEffect(() => {
    const value = (user?.theme || "cyan") as ThemeName;
    setSelected(value);
    applyTheme(value);
  }, [user]);

  async function choose(theme: ThemeName) {
    setSelected(theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent("auron-theme-change", { detail: theme }));
    if (user) {
      await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) }).catch(() => null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="text-sm font-black uppercase">Theme Engine</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(themePresets) as ThemeName[]).map((theme) => (
          <button key={theme} onClick={() => choose(theme)} className={`rounded-xl border p-3 text-left transition ${selected === theme ? "border-[var(--auron-primary)] bg-[var(--auron-primary)]/15" : "border-white/10 bg-black/20"}`}>
            <div className="font-black">{labels[theme]}</div>
            <div className="mt-2 flex gap-1">
              {Object.values(themePresets[theme]).slice(0, 4).map((color) => <span key={color} className="h-5 w-5 rounded-full border border-white/10" style={{ background: color }} />)}
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-[#a9dfff]">Tema salvo no perfil do usuario.</div>
    </div>
  );
}
