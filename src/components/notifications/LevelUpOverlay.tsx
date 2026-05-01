export function LevelUpOverlay({ level }: { level: number }) {
  return (
    <div className="auron-panel rounded-2xl p-6 text-center shadow-cyan">
      <div className="text-sm uppercase text-[#c9b9dc]">System Event</div>
      <div className="auron-title mt-2 text-4xl font-black">LEVEL UP</div>
      <div className="mt-2 text-xl font-black">Level {level}</div>
    </div>
  );
}

