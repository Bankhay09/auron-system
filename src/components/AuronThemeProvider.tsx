"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/theme-presets";

export function AuronThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let active = true;
    const publicTheme = localStorage.getItem("auron-theme:public") || "cyan";
    applyTheme(publicTheme);
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const user = data?.user;
        const saved = user ? localStorage.getItem(`auron-theme:${user.id}`) || user.theme || publicTheme : publicTheme;
        applyTheme(saved);
      })
      .catch(() => applyTheme(publicTheme));

    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith("auron-theme")) applyTheme(event.newValue || "cyan");
    };
    const onThemeChange = () => applyTheme(localStorage.getItem("auron-theme:active") || "cyan");
    window.addEventListener("storage", onStorage);
    window.addEventListener("auron-theme-change", onThemeChange);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auron-theme-change", onThemeChange);
    };
  }, []);

  return children;
}
