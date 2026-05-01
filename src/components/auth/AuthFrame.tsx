import { AuronLogo } from "@/components/AuronLogo";
import type { ReactNode } from "react";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050506] px-4 py-8 text-[#f6efe2]">
      <div className="auron-bg fixed inset-0 -z-10 opacity-70" />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px]">
          <div className="hidden content-center lg:grid">
            <AuronLogo />
            <h1 className="mt-8 max-w-2xl text-6xl font-black uppercase leading-none text-white">Auron System</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#bda889]">
              Plataforma de disciplina, diario estoico, habitos, metricas e arquitetura pessoal.
            </p>
          </div>
          <div className="auron-panel rounded-2xl border border-[#9b1c1c]/40 p-6 shadow-[0_0_42px_rgba(80,10,10,0.26)]">
            <div className="mb-6 lg:hidden"><AuronLogo /></div>
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.28em] text-[#bda889]">Acesso restrito</div>
              <h2 className="mt-2 text-3xl font-black uppercase text-white">{title}</h2>
              <p className="mt-2 text-sm text-[#bda889]">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
