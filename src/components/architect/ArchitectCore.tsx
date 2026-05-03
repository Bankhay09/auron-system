"use client";

/* eslint-disable @next/next/no-img-element */

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ArchitectMode = "idle" | "focus" | "alert" | "success" | "shadow";
export type ArchitectRuntimeState = "idle" | "analyzing" | "warning" | "success";

type ArchitectStateContextValue = {
  architectState: ArchitectRuntimeState;
  setArchitectState: (state: ArchitectRuntimeState) => void;
};

const ArchitectStateContext = createContext<ArchitectStateContextValue | null>(null);

const runtimeToMode: Record<ArchitectRuntimeState, ArchitectMode> = {
  idle: "idle",
  analyzing: "focus",
  warning: "alert",
  success: "success"
};

type ArchitectCoreProps = {
  mode?: ArchitectMode;
  size?: "small" | "medium" | "large";
  className?: string;
};

export function ArchitectStateProvider({ children }: { children: ReactNode }) {
  const [architectState, setArchitectState] = useState<ArchitectRuntimeState>("idle");
  const value = useMemo(() => ({ architectState, setArchitectState }), [architectState]);

  return <ArchitectStateContext.Provider value={value}>{children}</ArchitectStateContext.Provider>;
}

export function useArchitectState() {
  return useContext(ArchitectStateContext) ?? { architectState: "idle" as ArchitectRuntimeState, setArchitectState: () => undefined };
}

export function ArchitectCore({ mode, size = "medium", className }: ArchitectCoreProps) {
  const { architectState } = useArchitectState();
  const visualMode = mode ?? runtimeToMode[architectState];

  return (
    <div
      className={cn("architect-core", `architect-size-${size}`, `architect-mode-${visualMode}`, className)}
      role="img"
      aria-label={`Arquiteto em estado ${visualMode}`}
    >
      <div className="architect-aura" />
      <img className="architect-image" src="/sprites/architect-idle.png" alt="Arquiteto" />
    </div>
  );
}
