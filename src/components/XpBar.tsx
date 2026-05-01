import { percent } from "@/lib/utils";

export function XpBar({ label, value, max }: { label: string; value: number; max: number }) {
  const p = percent(value, max);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[#c9b9dc]">
        <span>{label}</span>
        <strong className="text-white">{p}%</strong>
      </div>
      <div className="auron-bar">
        <span style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

