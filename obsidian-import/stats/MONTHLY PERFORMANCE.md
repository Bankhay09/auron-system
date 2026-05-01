# MONTHLY PERFORMANCE

```dataviewjs
const code = await app.vault.adapter.read("00 - System/System Core.js");
const SLCore = new Function(`${code}; return SLCore;`)();
const data = SLCore.build(dv);
const { monthDays, month, helpers, CONFIG } = data;
const { dayScore, missionRate, pct } = helpers;

function bar(label, value, max = 100) {
  const p = pct(value, max);
  return `<div class="bar"><div><span>${label}</span><b>${p}%</b></div><i><em style="width:${p}%"></em></i></div>`;
}

const heat = monthDays.map(day => `
  <div class="cell ${day.validDay ? "ok" : day.failedMain ? "bad" : day.completedCount ? "warn" : ""}">
    <span>${day.date.getDate()}</span><b>${day.key <= data.todayKey ? dayScore(day) : ""}</b>
  </div>
`).join("");

const maxXp = Math.max(...monthDays.filter(day => day.key <= data.todayKey).map(day => Math.max(day.xp, 0)), 30);
const bars = monthDays.filter(day => day.key <= data.todayKey).map(day => `
  <div class="col"><strong style="height:${18 + pct(Math.max(day.xp, 0), maxXp) * 1.1}px"></strong><span>${day.date.getDate()}</span></div>
`).join("");

const habits = CONFIG.missions.map(mission => bar(mission.label, missionRate(mission.id, monthDays, data.today))).join("");

dv.container.innerHTML = `
<style>
.stats{--line:rgba(220,170,255,.28);--pink:#f058ff;--muted:#c9b9dc;color:#f7efff;border:1px solid var(--line);border-radius:18px;padding:22px;background:radial-gradient(circle at 20% 10%,rgba(240,88,255,.18),transparent 30%),linear-gradient(180deg,#141020,#080711)}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px}.top h1{margin:0;font-size:34px;text-shadow:0 0 10px rgba(240,88,255,.7)}.pill{border:1px solid rgba(240,88,255,.45);border-radius:999px;padding:10px 16px;background:rgba(240,88,255,.14);font-weight:900}.grid{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:14px}.card{border:1px solid var(--line);border-radius:14px;background:rgba(12,9,24,.86);padding:14px;overflow:hidden}.card h2{margin:0 0 12px;font-size:15px;text-transform:uppercase}.big{font-size:34px;font-weight:950}.bar{margin:10px 0}.bar div{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}.bar b{color:#fff}.bar i{display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}.bar em{display:block;height:100%;background:linear-gradient(90deg,#a66cff,#f058ff)}.heat{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.cell{min-height:58px;border:1px solid rgba(255,255,255,.1);border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.055)}.cell span{font-size:11px;color:var(--muted)}.cell b{font-size:18px}.cell.ok{background:rgba(240,88,255,.28);border-color:rgba(240,88,255,.55)}.cell.warn{background:rgba(255,202,92,.14)}.cell.bad{background:rgba(255,80,120,.16)}.chart{height:220px;display:grid;grid-template-columns:repeat(${Math.max(month.days,1)},1fr);gap:5px;align-items:end;border-bottom:1px solid rgba(255,255,255,.16)}.col{height:195px;display:grid;align-items:end;text-align:center;gap:4px}.col strong{display:block;min-height:8px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,#ff5cff,#6b3ac5);box-shadow:0 0 10px rgba(240,88,255,.5)}.col span{font-size:9px;color:var(--muted)}.row{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);padding:8px 0;color:var(--muted)}.row b{color:#fff}@media(max-width:900px){.grid{grid-template-columns:1fr}.top{display:block}}
</style>
<div class="stats">
  <div class="top"><div><h1>MONTHLY PERFORMANCE</h1><p>${data.today.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p></div><div class="pill">${month.score}/100 score</div></div>
  <div class="grid">
    <section class="card"><h2>Resumo</h2><div class="big">${month.xp} XP</div>${bar("Consistencia",month.valid,month.days)}${bar("Tarefas",month.tasks,month.days*8)}${bar("Desempenho",month.score,100)}<div class="row"><span>Dias perfeitos</span><b>${month.perfect}</b></div><div class="row"><span>Penalidade</span><b>-${month.penalties} XP</b></div><div class="row"><span>Descanso</span><b>+${month.rest} XP</b></div></section>
    <section class="card"><h2>Calendario / Score</h2><div class="heat">${heat}</div></section>
    <section class="card"><h2>Habit Graph</h2>${habits}</section>
    <section class="card" style="grid-column:1/-1"><h2>XP diario</h2><div class="chart">${bars}</div></section>
  </div>
</div>`;
```
