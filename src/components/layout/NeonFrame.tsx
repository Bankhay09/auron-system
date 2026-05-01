import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NeonFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-[var(--auron-primary)]/40 bg-white/[0.04] p-3 shadow-neon", className)}>{children}</div>;
}

