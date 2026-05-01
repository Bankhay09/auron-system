import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SystemWindow({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("auron-panel rounded-2xl p-4", className)}>
      <h2 className="mb-4 text-sm font-black uppercase text-white">{title}</h2>
      {children}
    </section>
  );
}

