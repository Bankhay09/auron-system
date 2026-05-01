export function AuronLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--auron-primary)]/60 bg-[linear-gradient(135deg,#0047ff,#00133d)] shadow-[0_0_26px_rgba(83,229,255,0.35)]">
        <svg viewBox="0 0 64 64" className="h-9 w-9 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" aria-hidden="true">
          <path fill="white" d="M32 6 46 42 36 36 33 54 30 54 27 36 18 42 32 6Z" />
          <path fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" d="M14 39a22 22 0 0 1 8-25M42 14a22 22 0 0 1 8 25M16 46l16 12 16-12" />
        </svg>
      </div>
      {!compact && (
        <div>
          <div className="auron-title text-xl font-black uppercase leading-none">Auron</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#a9dfff]">System Interface</div>
        </div>
      )}
    </div>
  );
}
