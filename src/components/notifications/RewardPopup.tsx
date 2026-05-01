export function RewardPopup({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-auron-gold bg-auron-gold/10 p-4 text-[#fff3c4] shadow-gold">
      <div className="font-black">[REWARD]</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

