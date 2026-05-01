import type { SystemEvent } from "@/types/auron";

const variants = {
  penalty: "border-[var(--auron-danger)] text-[var(--auron-danger)] shadow-[0_0_26px_rgba(255,77,56,0.22)]",
  "quest-failed": "border-[var(--auron-danger)] text-[var(--auron-danger)] shadow-[0_0_26px_rgba(255,77,56,0.22)]",
  reward: "border-[#ffd166] text-[#ffd166] shadow-[0_0_28px_rgba(255,209,102,0.25)]",
  "level-up": "border-[var(--auron-primary)] text-[var(--auron-primary)] shadow-[0_0_28px_rgba(83,229,255,0.25)]",
  "rank-up": "border-[#ffd166] text-[#ffd166] shadow-[0_0_28px_rgba(255,209,102,0.25)]",
  normal: "border-[var(--auron-primary)] text-[var(--auron-primary)]",
  "quest-complete": "border-[var(--auron-success)] text-[var(--auron-success)]",
  "focus-mode": "border-[var(--auron-primary)] text-[var(--auron-primary)]",
  "boss-mode": "border-[var(--auron-danger)] text-[var(--auron-danger)]",
};

export function SystemNotification({ event }: { event: SystemEvent }) {
  const variant = variants[event.eventType] ?? variants.normal;
  const motion = event.eventType === "penalty" || event.eventType === "quest-failed" ? "notification-glitch" : event.eventType === "reward" || event.eventType === "quest-complete" ? "notification-gold" : event.eventType === "level-up" ? "notification-cyan" : "";
  return (
    <div className={`auron-panel notification-frame rounded-2xl border p-4 ${variant} ${motion}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#a9dfff]">
        <span className="grid h-6 w-6 place-items-center rounded-full border border-current">!</span>
        System Notification
      </div>
      <div className="mt-3 text-2xl font-black text-white">{event.title}</div>
      <p className="mt-3 text-sm leading-6 text-[#d8f7ff]">{event.message}</p>
    </div>
  );
}

export const LevelUpNotification = SystemNotification;
export const QuestCompleteNotification = SystemNotification;
export const PenaltyNotification = SystemNotification;
export const RewardNotification = SystemNotification;
