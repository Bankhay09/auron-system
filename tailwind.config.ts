import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        auron: {
          bg: "#080611",
          panel: "#120d20",
          pink: "#f058ff",
          purple: "#9d63ff",
          cyan: "#38e8ff",
          gold: "#ffd166",
          danger: "#ff4d6d"
        }
      },
      boxShadow: {
        neon: "0 0 24px rgba(240, 88, 255, 0.35)",
        cyan: "0 0 24px rgba(56, 232, 255, 0.35)",
        gold: "0 0 24px rgba(255, 209, 102, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;

