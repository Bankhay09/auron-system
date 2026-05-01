import type { Rank, SystemState } from "@/types/auron";
import type { CSSProperties } from "react";

export type AuronTheme = {
  primary: string;
  secondary: string;
  glow: string;
  danger: string;
  success: string;
  glowIntensity: "low" | "medium" | "high" | "cinematic";
  animation: "idle" | "pulse" | "flash" | "glitch" | "shake" | "ascend";
  backgroundEffect: "grid" | "particles" | "aura" | "alarm" | "gold-rain";
  borderStyle: "thin" | "pulse" | "ornate" | "glitch";
};

export const rankThemes: Record<Rank, AuronTheme> = {
  E: theme("#53e5ff", "#006bff", "#8ff6ff", "medium", "particles"),
  D: theme("#2f8cff", "#53e5ff", "#78b7ff", "medium", "grid"),
  C: theme("#2fffd2", "#38e8ff", "#b9f7ff", "high", "particles"),
  B: theme("#5cff9d", "#2fffd2", "#9dffd0", "high", "aura"),
  A: theme("#ffd166", "#53e5ff", "#ffe8a3", "high", "gold-rain"),
  S: theme("#9d63ff", "#53e5ff", "#c084fc", "cinematic", "aura"),
  SS: theme("#ff244d", "#080611", "#ff6b8a", "cinematic", "alarm", "glitch")
};

export const stateThemes: Partial<Record<SystemState, Partial<AuronTheme>>> = {
  "level-up": { primary: "#38e8ff", glow: "#b9f7ff", animation: "ascend", backgroundEffect: "particles" },
  "rank-up": { primary: "#ffd166", glow: "#ffe8a3", glowIntensity: "cinematic", animation: "flash", borderStyle: "ornate" },
  "quest-complete": { primary: "#5cff9d", glow: "#b9ffdd", animation: "pulse" },
  "quest-failed": { primary: "#ff4d38", glow: "#ffb0a8", animation: "glitch", backgroundEffect: "alarm" },
  penalty: { primary: "#ff4d38", danger: "#ff4d38", animation: "shake", borderStyle: "glitch", backgroundEffect: "alarm" },
  reward: { primary: "#ffd166", glow: "#ffe8a3", animation: "flash", backgroundEffect: "gold-rain" },
  "boss-mode": { primary: "#ff244d", secondary: "#080611", animation: "glitch", borderStyle: "glitch", backgroundEffect: "alarm" },
  "focus-mode": { primary: "#38e8ff", secondary: "#111827", animation: "idle", backgroundEffect: "grid" }
};

export function resolveTheme(rank: Rank, state: SystemState = "normal"): AuronTheme {
  return { ...rankThemes[rank], ...(stateThemes[state] ?? {}) };
}

export function themeVars(theme: AuronTheme) {
  return {
    "--auron-primary": theme.primary,
    "--auron-secondary": theme.secondary,
    "--auron-glow": theme.glow,
    "--auron-danger": theme.danger,
    "--auron-success": theme.success
  } as CSSProperties;
}

function theme(
  primary: string,
  secondary: string,
  glow: string,
  glowIntensity: AuronTheme["glowIntensity"],
  backgroundEffect: AuronTheme["backgroundEffect"],
  borderStyle: AuronTheme["borderStyle"] = "pulse"
): AuronTheme {
  return {
    primary,
    secondary,
    glow,
    danger: "#ff4d38",
    success: "#2fffd2",
    glowIntensity,
    animation: "pulse",
    backgroundEffect,
    borderStyle
  };
}
