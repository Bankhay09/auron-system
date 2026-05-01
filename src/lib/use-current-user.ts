"use client";

import { useEffect, useState } from "react";

export type OnboardingData = {
  mainGoal?: string;
  currentSituation?: string;
  habitsToAbandon?: string[];
  habitsToImplement?: string[];
};

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  onboardingCompleted: boolean;
  onboardingData: OnboardingData;
  theme: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
