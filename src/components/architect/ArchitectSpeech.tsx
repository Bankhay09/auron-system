"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ArchitectSpeechProps = {
  messages: string[];
  className?: string;
  speedMs?: number;
};

export function ArchitectSpeech({ messages, className, speedMs = 18 }: ArchitectSpeechProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const current = messages[messageIndex] || "";
  const displayed = useMemo(() => current.slice(0, charIndex), [current, charIndex]);

  useEffect(() => {
    setMessageIndex(0);
    setCharIndex(0);
  }, [messages]);

  useEffect(() => {
    if (!current) return;
    if (charIndex < current.length) {
      const timer = window.setTimeout(() => setCharIndex((value) => value + 1), speedMs);
      return () => window.clearTimeout(timer);
    }
    if (messageIndex < messages.length - 1) {
      const timer = window.setTimeout(() => {
        setMessageIndex((value) => value + 1);
        setCharIndex(0);
      }, 850);
      return () => window.clearTimeout(timer);
    }
  }, [charIndex, current, messageIndex, messages.length, speedMs]);

  return (
    <motion.div
      className={cn("relative rounded-2xl border border-[var(--auron-primary)]/50 bg-[#020a13]/85 p-4 text-sm leading-6 text-[#d7f7ff] shadow-cyan backdrop-blur", className)}
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.24 }}
    >
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.26em] text-[var(--auron-primary)]">O Arquiteto // Directiva</div>
      <p className="min-h-12">
        {displayed}
        <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[var(--auron-primary)] align-middle" />
      </p>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,transparent,rgba(83,229,255,0.08),transparent)]" />
    </motion.div>
  );
}
