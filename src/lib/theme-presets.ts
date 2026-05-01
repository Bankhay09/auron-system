export type ThemeName = "cyan" | "gold" | "blood" | "violet";

export const themePresets: Record<ThemeName, Record<string, string>> = {
  cyan: {
    "--auron-primary": "#00f0ff",
    "--auron-secondary": "#006bff",
    "--auron-glow": "#8ff6ff",
    "--auron-danger": "#ff4d38",
    "--auron-success": "#2fffd2"
  },
  gold: {
    "--auron-primary": "#d8a94f",
    "--auron-secondary": "#7a1515",
    "--auron-glow": "#ffe1a1",
    "--auron-danger": "#ff4d38",
    "--auron-success": "#c9f08a"
  },
  blood: {
    "--auron-primary": "#ff3d3d",
    "--auron-secondary": "#6e0d0d",
    "--auron-glow": "#ff9b8d",
    "--auron-danger": "#ff1f1f",
    "--auron-success": "#d8a94f"
  },
  violet: {
    "--auron-primary": "#9d63ff",
    "--auron-secondary": "#00f0ff",
    "--auron-glow": "#d0b4ff",
    "--auron-danger": "#ff4d38",
    "--auron-success": "#2fffd2"
  }
};

export function applyTheme(name: string) {
  const theme = themePresets[(name as ThemeName) || "cyan"] ?? themePresets.cyan;
  for (const [key, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(key, value);
  }
}
