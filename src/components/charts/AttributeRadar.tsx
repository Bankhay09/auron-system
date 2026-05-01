"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { AttributeMetric } from "@/lib/auron-engine";

export function AttributeRadar({ data }: { data: AttributeMetric[] }) {
  return (
    <div className="min-h-[25rem]">
      <div className="h-72 overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="64%" margin={{ top: 28, right: 44, bottom: 28, left: 44 }}>
            <PolarGrid stroke="rgba(83,229,255,0.24)" />
            <PolarAngleAxis dataKey="attribute" tick={{ fill: "#c7f3ff", fontSize: 11 }} />
            <Radar dataKey="value" stroke="var(--auron-primary)" fill="var(--auron-primary)" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-1 text-xs text-[#a9dfff]">
        {data.map((item) => (
          <div key={item.attribute} className="flex justify-between border-b border-white/10 py-1">
            <span>{item.attribute}</span>
            <strong className="text-white">{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
