"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PerformancePoint } from "@/types/auron";

export function ProgressionGraph({ data }: { data: PerformancePoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" stroke="#a9dfff" />
          <YAxis stroke="#a9dfff" />
          <Tooltip cursor={{ fill: "rgba(83,229,255,0.08)" }} contentStyle={{ background: "#061424", border: "1px solid rgba(83,229,255,0.45)", color: "white" }} />
          <Bar dataKey="score" fill="var(--auron-primary)" radius={[8, 8, 2, 2]} />
          <Bar dataKey="xp" fill="var(--auron-secondary)" radius={[8, 8, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
