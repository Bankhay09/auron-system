"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuronSnapshot, AttributeMetric } from "@/lib/auron-core";
import { buildQuestHabits, buildSnapshot, createDaily, event, progressThroughDay, todayKey, urgencyColor } from "@/lib/auron-core";
import type { OnboardingData } from "@/lib/use-current-user";

export type { AttributeMetric };
export { progressThroughDay, todayKey, urgencyColor };

export type AuronActions = {
  toggleHabit: (habitId: string) => Promise<void>;
  completeQuest: () => Promise<void>;
  closeDay: () => Promise<void>;
  resetToday: () => Promise<void>;
  resetSystem: () => Promise<void>;
  getDebugState: () => string;
};

type AuronOptions = {
  userId?: string;
  username?: string;
  onboardingData?: OnboardingData;
};

export function useAuronSystem(options: AuronOptions = {}): AuronSnapshot & AuronActions {
  const fallback = useMemo(() => {
    const habits = buildQuestHabits(options.onboardingData);
    return buildSnapshot({
      daily: createDaily(todayKey(), habits),
      history: [],
      events: [event("normal", "SYSTEM ONLINE", "Auron System iniciou o monitoramento do player.")]
    }, options.username || "Bankai", false);
  }, [options.onboardingData, options.username]);
  const [snapshot, setSnapshot] = useState<AuronSnapshot>(fallback);
  const [debugState, setDebugState] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/system", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.system) {
        setSnapshot(data.system);
        setDebugState(JSON.stringify(data.system, null, 2));
      }
    } catch {
      setSnapshot(fallback);
    }
  }, [fallback]);

  useEffect(() => {
    setSnapshot(fallback);
    refresh();
    const midnightCheck = window.setInterval(refresh, 30 * 1000);
    const onDiarySaved = () => refresh();
    window.addEventListener("auron-diary-saved", onDiarySaved);
    return () => {
      window.clearInterval(midnightCheck);
      window.removeEventListener("auron-diary-saved", onDiarySaved);
    };
  }, [fallback, refresh]);

  async function send(action: string, payload: Record<string, unknown> = {}) {
    const response = await fetch("/api/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json().catch(() => null);
    if (data?.system) {
      setSnapshot(data.system);
      setDebugState(JSON.stringify(data.system, null, 2));
    }
  }

  return {
    ...snapshot,
    toggleHabit: (habitId: string) => send("toggleHabit", { habitId }),
    completeQuest: () => send("completeQuest"),
    closeDay: () => send("closeDay"),
    resetToday: () => refresh(),
    resetSystem: () => send("resetSystem"),
    getDebugState: () => debugState || JSON.stringify(snapshot, null, 2)
  };
}
