# SYSTEM AUDIT

```dataviewjs
const code = await app.vault.adapter.read("00 - System/System Core.js");
const SLCore = new Function(`${code}; return SLCore;`)();
const data = SLCore.build(dv);
const rows = data.allDays
  .filter(day => day.key <= data.todayKey)
  .map(day => `<tr><td>${day.key}</td><td>${day.path ? "OK" : "MISSING"}</td><td>${day.completedCount}</td><td>${day.xp}</td><td>${day.validDay ? "VALIDO" : "NAO"}</td><td>${day.failedMain ? "SIM" : "NAO"}</td></tr>`)
  .join("");
dv.container.innerHTML = `<style>.audit{color:#f7efff;border:1px solid rgba(220,170,255,.28);border-radius:18px;padding:22px;background:linear-gradient(180deg,#141020,#080711)}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid rgba(255,255,255,.1);padding:8px;text-align:left}th{color:#fff}td{color:#c9b9dc}</style><div class="audit"><h1>SYSTEM AUDIT</h1><p>Daily Notes lidas pelo sistema e dias ausentes no periodo.</p><table><thead><tr><th>Data</th><th>Arquivo</th><th>Tarefas</th><th>XP</th><th>Dia valido</th><th>Falha main</th></tr></thead><tbody>${rows}</tbody></table></div>`;
```
