"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { progressThroughDay, urgencyColor } from "@/lib/auron-engine";

export function SystemClock({ completed, finalColor, lastCompletedAt }: { completed: boolean; finalColor: string | null; lastCompletedAt?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (completed) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [completed]);

  const progress = completed && lastCompletedAt ? progressThroughDay(new Date(lastCompletedAt)) : progressThroughDay(now);
  const color = finalColor ?? urgencyColor(progress);
  const label = completed && lastCompletedAt ? new Date(lastCompletedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const degrees = useMemo(() => Math.round(progress * 360), [progress]);

  return (
    <div className="auron-panel relative overflow-hidden rounded-2xl p-4" style={{ "--clock-color": color } as CSSProperties}>
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 40%, ${color}, transparent 48%)` }} />
      <div className="relative flex items-center gap-4">
        <div className={`system-clock ${completed ? "is-complete" : ""}`}>
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="53" r="31" fill="none" stroke="white" strokeWidth="8" />
            <path d="M31 19 20 10M69 19 80 10" stroke="white" strokeWidth="7" strokeLinecap="round" />
            <path d="M50 53 50 33M50 53 64 66" stroke="white" strokeWidth="6" strokeLinecap="round" style={{ transform: `rotate(${degrees}deg)`, transformOrigin: "50px 53px" }} />
            <circle cx="50" cy="53" r="5" fill="white" />
            <path d="M50 82v7M18 53h8M74 53h8M50 17v8" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#a9dfff]">{completed ? "Quest finalized" : "Deadline protocol"}</div>
          <div className="mt-1 text-3xl font-black" style={{ color }}>{label}</div>
          <div className="mt-1 text-xs text-[#a9dfff]">Prazo maximo: 00:00</div>
        </div>
      </div>
    </div>
  );
}
