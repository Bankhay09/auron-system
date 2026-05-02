"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { AuronLogo } from "@/components/AuronLogo";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Daily Quest", "/daily-quest"],
  ["Diario", "/diary"],
  ["Ranking", "/ranking"],
  ["Redes Sociais", "/social"],
  ["Side Quests", "/side-quests"],
  ["Weekly", "/weekly"],
  ["Monthly", "/monthly"],
  ["Overview", "/overview"],
  ["Audit", "/audit"],
  ["Settings", "/settings"]
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-auron-bg text-[#f7efff]">
      <div className="auron-bg fixed inset-0 -z-10" />
      <div className="auron-particles fixed inset-0 -z-10" />
      <div className="mx-auto flex w-full max-w-[1480px] gap-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="auron-panel sticky top-4 rounded-2xl p-4">
            <AuronLogo />
            <nav className="mt-6 grid gap-2">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#c7f3ff] hover:border-[var(--auron-primary)] hover:text-white">
                  {label}
                </Link>
              ))}
              <button onClick={logout} className="rounded-lg border border-[var(--auron-danger)]/40 px-3 py-2 text-left text-sm text-[#ffd6c9] hover:border-[var(--auron-danger)]">
                Logout
              </button>
            </nav>
          </div>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
