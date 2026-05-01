import { AppShell } from "@/components/layout/AppShell";
import { SystemWindow } from "@/components/layout/SystemWindow";
import { weeklyPerformance } from "@/data/mock-data";

export default function AuditPage() {
  return (
    <AppShell>
      <SystemWindow title="System Audit">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white">
              <tr><th className="py-2">Data</th><th>Arquivo</th><th>Tarefas</th><th>XP</th><th>Valido</th></tr>
            </thead>
            <tbody className="text-[#c9b9dc]">
              {weeklyPerformance.map((day, index) => (
                <tr key={day.label} className="border-t border-white/10">
                  <td className="py-2">2026-04-{24 + index}</td>
                  <td>{day.valid ? "OK" : "MISSING"}</td>
                  <td>{day.tasks}</td>
                  <td>{day.xp}</td>
                  <td>{day.valid ? "VALIDO" : "NAO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SystemWindow>
    </AppShell>
  );
}

