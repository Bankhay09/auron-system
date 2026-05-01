# WEEKLY PERFORMANCE

```dataviewjs
const code = await app.vault.adapter.read("00 - System/System Core.js");
const SLCore = new Function(`${code}; return SLCore;`)();
const data = SLCore.build(dv);
const { weekDays, week, helpers, CONFIG } = data;
const { dayScore, missionRate, pct } = helpers;

function bar(label, value, max = 100) {
  const p = pct(value, max);
  return `<div class="bar"><div><span>${label}</span><b>${p}%</b></div><i><em style="width:${p}%"></em></i></div>`;
}

const maxXp = Math.max(...weekDays.map(day => Math.max(day.xp, 0)), 30);
const chart = weekDays.map(day => `
  <div class="col">
    <strong style="height:${20 + pct(Math.max(day.xp, 0), maxXp) * 1.3}px"></strong>
    <span>${day.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}<br>${dayScore(day)}</span>
  </div>
`).join("");

const matrix = weekDays.map(day => `
  <div class="day ${day.validDay ? "ok" : day.failedMain ? "bad" : day.completedCount ? "warn" : ""}">
    <span>${day.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
    <b>${day.completedCount}</b>
    <small>${Math.max(day.xp, 0)} XP</small>
  </div>
`).join("");

const habits = CONFIG.missions.map(mission => bar(mission.label, missionRate(mission.id, weekDays, data.today))).join("");

dv.container.innerHTML = `
<style>
.stats{--line:rgba(220,170,255,.28);--pink:#f058ff;--muted:#c9b9dc;color:#f7efff;border:1px solid var(--line);border-radius:18px;padding:22px;background:radial-gradient(circle at 20% 10%,rgba(240,88,255,.18),transparent 30%),linear-gradient(180deg,#141020,#080711);box-shadow:0 0 30px rgba(240,88,255,.15)}.top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px}.top h1{margin:0;font-size:34px;text-shadow:0 0 10px rgba(240,88,255,.7)}.pill{border:1px solid rgba(240,88,255,.45);border-radius:999px;padding:10px 16px;background:rgba(240,88,255,.14);font-weight:900}.grid{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:14px}.card{border:1px solid var(--line);border-radius:14px;background:rgba(12,9,24,.86);padding:14px;overflow:hidden}.card h2{margin:0 0 12px;font-size:15px;text-transform:uppercase}.big{font-size:34px;font-weight:950}.bar{margin:10px 0}.bar div{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}.bar b{color:#fff}.bar i{display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}.bar em{display:block;height:100%;background:linear-gradient(90deg,#a66cff,#f058ff);box-shadow:0 0 14px rgba(240,88,255,.65)}.chart{height:240px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end;border-bottom:1px solid rgba(255,255,255,.16);padding-top:12px}.col{height:215px;display:grid;align-items:end;text-align:center;gap:6px}.col strong{display:block;min-height:8px;border-radius:10px 10px 3px 3px;background:linear-gradient(180deg,#ff5cff,#6b3ac5);box-shadow:0 0 14px rgba(240,88,255,.6)}.col span,.day span,.day small{color:var(--muted);font-size:10px}.matrix{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.day{min-height:72px;border:1px solid rgba(255,255,255,.1);border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.055)}.day b{font-size:22px}.day.ok{background:rgba(240,88,255,.28);border-color:rgba(240,88,255,.55)}.day.warn{background:rgba(255,202,92,.14)}.day.bad{background:rgba(255,80,120,.16)}.rows{display:grid;gap:8px}.row{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);padding:8px 0;color:var(--muted)}.row b{color:#fff}@media(max-width:900px){.grid{grid-template-columns:1fr}.top{display:block}.chart{height:190px}.col{height:165px}}
</style>
<div class="stats">
  <div class="top"><div><h1>WEEKLY PERFORMANCE</h1><p>Desempenho dos ultimos 7 dias</p></div><div class="pill">${week.score}/100 score</div></div>
  <div class="grid">
    <section class="card"><h2>Core Score</h2><div class="big">${week.xp} XP</div>${bar("Consistencia", week.valid, 7)}${bar("Tarefas", week.tasks, 56)}${bar("Desempenho", week.score, 100)}</section>
    <section class="card"><h2>XP / Score Graph</h2><div class="chart">${chart}</div></section>
    <section class="card"><h2>Diagnostico</h2><div class="rows"><div class="row"><span>Dias validos</span><b>${week.valid}/7</b></div><div class="row"><span>Dias perfeitos</span><b>${week.perfect}</b></div><div class="row"><span>Descanso</span><b>+${week.rest} XP</b></div><div class="row"><span>Penalidade</span><b>-${week.penalties} XP</b></div></div></section>
    <section class="card" style="grid-column:span 2"><h2>Weekly Matrix</h2><div class="matrix">${matrix}</div></section>
    <section class="card"><h2>Habit Graph</h2>${habits}</section>
  </div>
</div>`;
```
