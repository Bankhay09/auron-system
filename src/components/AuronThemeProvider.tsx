"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/theme-presets";

export function AuronThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let active = true;
    const publicTheme = "cyan";
    applyTheme(publicTheme);
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const user = data?.user;
        applyTheme(user?.theme || publicTheme);
      })
      .catch(() => applyTheme(publicTheme));

    const onThemeChange = (event: Event) => {
      const theme = event instanceof CustomEvent ? event.detail : "cyan";
      applyTheme(typeof theme === "string" ? theme : "cyan");
    };
    window.addEventListener("auron-theme-change", onThemeChange);
    return () => {
      active = false;
      window.removeEventListener("auron-theme-change", onThemeChange);
    };
  }, []);

  return children;
}
