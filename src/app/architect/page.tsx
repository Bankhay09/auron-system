import { AppShell } from "@/components/layout/AppShell";
import { ArchitectPanel } from "@/components/architect/ArchitectPanel";

export default function ArchitectPage() {
  return (
    <AppShell>
      <header className="mb-5">
        <div className="text-xs uppercase tracking-[0.28em] text-[var(--auron-primary)]">Auron System // Strategic Core</div>
        <h1 className="auron-title mt-2 text-3xl font-black uppercase md:text-4xl">O Arquiteto</h1>
        <p className="mt-2 max-w-2xl text-sm uppercase text-[#a9dfff]">Analise estrategica da sua evolucao.</p>
      </header>
      <ArchitectPanel />
    </AppShell>
  );
}
