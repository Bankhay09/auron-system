export function PenaltyWarning({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[var(--auron-danger)] bg-[var(--auron-danger)]/10 p-4 text-[#ffd1dc]">
      <div className="font-black">[WARNING]</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

