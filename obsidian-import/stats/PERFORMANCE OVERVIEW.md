# PERFORMANCE OVERVIEW

```dataviewjs
const code = await app.vault.adapter.read("00 - System/System Core.js");
const SLCore = new Function(`${code}; return SLCore;`)();
const data = SLCore.build(dv);
const { weeks, months, week, month, lifetime, helpers } = data;
const { pct } = helpers;

function bars(items, cls = "") {
  return items.map(item => `
    <div class="col"><strong style="height:${18 + item.score * 1.25}px"></strong><span>${item.label}<br>${item.score}</span></div>
  `).join("");
}

function card(item) {
  return `
    <section class="card">
      <h2>${item.label}</h2>
      <div class="big">${item.score}/100</div>
      <div class="bar"><div><span>XP</span><b>${item.xp}</b></div><i><em style="width:${pct(item.xp,1000)}%"></em></i></div>
      <div class="row"><span>Dias validos</span><b>${item.valid}/${item.days}</b></div>
      <div class="row"><span>Dias perfeitos</span><b>${item.perfect}</b></div>
      <div class="row"><span>Penalidades</span><b>-${item.penalties} XP</b></div>
    </section>
  `;
}

dv.container.innerHTML = `
<style>
.stats{--line:rgba(220,170,255,.28);--pink:#f058ff;--muted:#c9b9dc;color:#f7efff;border:1px solid var(--line);border-radius:18px;padding:22px;background:radial-gradient(circle at 20% 10%,rgba(240,88,255,.18),transparent 30%),linear-gradient(180deg,#141020,#080711)}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px}.top h1{margin:0;font-size:34px;text-shadow:0 0 10px rgba(240,88,255,.7)}.pill{border:1px solid rgba(240,88,255,.45);border-radius:999px;padding:10px 16px;background:rgba(240,88,255,.14);font-weight:900}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid var(--line);border-radius:14px;background:rgba(12,9,24,.86);padding:14px;overflow:hidden}.card h2{margin:0 0 12px;font-size:15px;text-transform:uppercase}.big{font-size:34px;font-weight:950}.chart{height:240px;display:grid;grid-template-columns:repeat(8,1fr);gap:10px;align-items:end;border-bottom:1px solid rgba(255,255,255,.16);padding-top:12px}.chart.month{grid-template-columns:repeat(6,1fr)}.col{height:215px;display:grid;align-items:end;text-align:center;gap:6px}.col strong{display:block;min-height:8px;border-radius:10px 10px 3px 3px;background:linear-gradient(180deg,#ff5cff,#6b3ac5);box-shadow:0 0 14px rgba(240,88,255,.6)}.col span{font-size:10px;color:var(--muted)}.bar{margin:10px 0}.bar div,.row{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}.bar b,.row b{color:#fff}.bar i{display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}.bar em{display:block;height:100%;background:linear-gradient(90deg,#a66cff,#f058ff)}.row{border-bottom:1px solid rgba(255,255,255,.08);padding:8px 0}@media(max-width:900px){.grid{grid-template-columns:1fr}.top{display:block}}
</style>
<div class="stats">
  <div class="top"><div><h1>PERFORMANCE OVERVIEW</h1><p>Semanas e meses consolidados</p></div><div class="pill">${lifetime.score}/100 geral</div></div>
  <div class="grid">
    ${card(week)}
    ${card(month)}
    ${card(lifetime)}
    <section class="card" style="grid-column:span 2"><h2>Weekly Graph</h2><div class="chart">${bars(weeks)}</div></section>
    <section class="card"><h2>Monthly Graph</h2><div class="chart month">${bars(months)}</div></section>
  </div>
</div>`;
```
