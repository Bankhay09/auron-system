# Auron System

```dataviewjs
/*
  Solo Leveling System 2.0 - Habit & Quest Tracker
  Entrada: notas em "01 - Daily"
  Saida: HUD RPG com XP, level, rank, radar, streak, missoes e progresso.
*/

const CONFIG = {
  dailyFolder: "01 - Daily",
  xpPerLevel: 100,
  ranks: [
    { name: "S", xp: 5000 },
    { name: "A", xp: 3000 },
    { name: "B", xp: 1800 },
    { name: "C", xp: 1000 },
    { name: "D", xp: 500 },
    { name: "E", xp: 0 }
  ],
  missions: [
    { id: "treino", label: "Treino", xp: 25, main: true, onlyTrainingDays: true, aliases: ["treino", "academia", "musculacao", "exercicio", "workout"] },
    { id: "java", label: "Java", xp: 20, main: true, aliases: ["java", "aula java", "pratica java", "programacao"] },
    { id: "porn", label: "Sem pornografia", xp: 30, main: true, aliases: ["sem pornografia", "no porn", "pornografia", "anti-vicio", "anti vicio"] },
    { id: "ingles", label: "Ingles", xp: 15, main: false, aliases: ["ingles", "english"] },
    { id: "japones", label: "Japones", xp: 15, main: false, aliases: ["japones", "japanese", "nihongo"] },
    { id: "guitarra", label: "Guitarra", xp: 20, main: false, aliases: ["guitarra", "violao", "musica"] },
    { id: "leitura", label: "Leitura", xp: 10, main: false, aliases: ["leitura", "ler", "livro", "10 paginas"] },
    { id: "dormir", label: "Dormir cedo", xp: 15, main: false, aliases: ["dormir cedo", "sono", "23:30", "antes de 23"] }
  ]
};

const today = startOfDay(new Date());
const todayKey = dateKey(today);

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s:/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return startOfDay(value);
  if (typeof value.toJSDate === "function") return startOfDay(value.toJSDate());
  if (typeof value === "string") return startOfDay(new Date(value));
  return startOfDay(new Date(String(value)));
}

function dateFromPage(page) {
  if (page.date) return toDate(page.date);
  if (page.file.day) return toDate(page.file.day);
  const match = page.file.name.match(/\d{4}-\d{2}-\d{2}/);
  return match ? startOfDay(new Date(match[0] + "T00:00:00")) : null;
}

function startOfDay(date) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

function isTrainingDay(date) {
  return [1, 3, 5].includes(date.getDay());
}

function isPast(date) {
  return dateKey(date) < todayKey;
}

function missionApplies(mission, date) {
  if (mission.onlyTrainingDays) return isTrainingDay(date);
  return true;
}

function taskMatches(task, mission) {
  const text = normalize(task.text);
  return mission.aliases.some(alias => text.includes(normalize(alias)));
}

function readDay(page) {
  const date = dateFromPage(page);
  if (!date) return null;

  const tasks = page.file.tasks.array();
  const completedTasks = tasks.filter(t => t.completed);
  const completedCount = completedTasks.length;
  const missionResults = {};
  let xp = 0;
  let penalties = 0;
  let restBonus = 0;

  for (const mission of CONFIG.missions) {
    if (!missionApplies(mission, date)) continue;
    const related = tasks.filter(t => taskMatches(t, mission));
    const completed = related.some(t => t.completed);
    missionResults[mission.id] = { ...mission, exists: related.length > 0, completed };
    if (completed) xp += mission.xp;
  }

  if (missionResults.treino?.completed) xp += 10;

  if (!isTrainingDay(date)) {
    const trainedOnRestDay = tasks.some(t => taskMatches(t, CONFIG.missions[0]) && t.completed);
    if (!trainedOnRestDay) {
      xp += 5;
      restBonus += 5;
    }
  }

  const pornOk = missionResults.porn?.completed === true;
  if (!pornOk && isPast(date)) {
    xp -= 30;
    penalties += 30;
  }

  if (completedCount < 2 && isPast(date)) {
    xp -= 10;
    penalties += 10;
  }

  const requiredMain = CONFIG.missions
    .filter(m => m.main && missionApplies(m, date))
    .map(m => missionResults[m.id])
    .filter(Boolean);

  const failedMain = isPast(date) && requiredMain.some(m => !m.completed);
  const validDay = completedCount >= 3 && !failedMain;
  const perfectDay = requiredMain.every(m => m.completed)
    && CONFIG.missions.filter(m => missionApplies(m, date)).every(m => missionResults[m.id]?.completed);

  return { page, date, key: dateKey(date), tasks, completedTasks, completedCount, missionResults, xp, penalties, restBonus, failedMain, validDay, perfectDay, pornOk };
}

function getRank(totalXp) {
  return CONFIG.ranks.find(rank => totalXp >= rank.xp) ?? CONFIG.ranks[CONFIG.ranks.length - 1];
}

function nextRank(totalXp) {
  const ascending = [...CONFIG.ranks].sort((a, b) => a.xp - b.xp);
  return ascending.find(rank => rank.xp > totalXp) ?? null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function pct(value, max) {
  return clamp(Math.round((value / Math.max(max, 1)) * 100));
}

function computeStreak(daysByKey) {
  let cursor = today;
  const todayDay = daysByKey.get(todayKey);
  if (todayDay && !todayDay.validDay && !todayDay.failedMain) cursor = addDays(today, -1);
  let count = 0;
  while (true) {
    const day = daysByKey.get(dateKey(cursor));
    if (!day || !day.validDay) break;
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function completionRate(ids, sourceDays = days) {
  const missionIds = Array.isArray(ids) ? ids : [ids];
  let total = 0;
  let done = 0;
  for (const day of sourceDays) {
    for (const id of missionIds) {
      const result = day.missionResults[id];
      if (!result) continue;
      total++;
      if (result.completed) done++;
    }
  }
  return total ? Math.round((done / total) * 100) : 0;
}

function missionScore(ids, sourceDays) {
  const missionIds = Array.isArray(ids) ? ids : [ids];
  let total = 0;
  let done = 0;

  for (const day of sourceDays) {
    for (const id of missionIds) {
      const mission = CONFIG.missions.find(item => item.id === id);
      if (!mission || !missionApplies(mission, day.date)) continue;
      const result = day.missionResults[id];
      total++;
      if (result?.completed) done++;
    }
  }

  return total ? (done / total) * 100 : 0;
}

function validDayScore(sourceDays) {
  const relevant = sourceDays.filter(day => day.key <= todayKey);
  if (!relevant.length) return 0;
  return (relevant.filter(day => day.validDay).length / relevant.length) * 100;
}

function penaltyResistance(sourceDays) {
  const relevant = sourceDays.filter(day => day.key <= todayKey);
  if (!relevant.length) return 100;
  const penaltyPressure = relevant.reduce((sum, day) => sum + day.penalties, 0);
  return clamp(100 - penaltyPressure / Math.max(relevant.length, 1) * 2);
}

function weightedMetric({ ids, dayWeight = 0.25, weekWeight = 0.35, monthWeight = 0.4, bonus = 0 }) {
  const todayScore = missionScore(ids, [currentDay]);
  const weekScore = missionScore(ids, weekDays);
  const monthScore = missionScore(ids, monthDays);
  return clamp(Math.round(todayScore * dayWeight + weekScore * weekWeight + monthScore * monthWeight + bonus));
}

function buildAttributeRadar() {
  const disciplineBonus = validDayScore(weekDays) * 0.12 + penaltyResistance(monthDays) * 0.08;
  const consistencyBonus = Math.min(streak * 3, 18);
  const recoveryBonus = Math.min(totalRestBonus, 20) * 0.35;

  return [
    {
      label: "Java",
      value: weightedMetric({ ids: "java", bonus: consistencyBonus * 0.25 }),
      detail: "Aulas, pratica e consistencia recente"
    },
    {
      label: "Anti-vicio",
      value: weightedMetric({ ids: "porn", dayWeight: 0.3, weekWeight: 0.4, monthWeight: 0.3, bonus: disciplineBonus }),
      detail: "Sem pornografia, penalidades e controle de impulso"
    },
    {
      label: "Treino",
      value: weightedMetric({ ids: "treino", bonus: recoveryBonus }),
      detail: "Treinos nos dias fixos e recuperacao ativa"
    },
    {
      label: "Estudos",
      value: weightedMetric({ ids: ["ingles", "japones", "leitura"], dayWeight: 0.2, weekWeight: 0.4, monthWeight: 0.4 }),
      detail: "Idiomas, leitura e volume intelectual"
    },
    {
      label: "Criativo",
      value: weightedMetric({ ids: "guitarra", dayWeight: 0.25, weekWeight: 0.45, monthWeight: 0.3 }),
      detail: "Guitarra e expressao criativa"
    }
  ];
}

function missionStatus(day, missionId) {
  const result = day?.missionResults?.[missionId];
  if (!result) return { icon: "◇", text: "Nao aplicavel", cls: "neutral" };
  if (result.completed) return { icon: "✓", text: "Completa", cls: "ok" };
  if (isPast(day.date)) return { icon: "✕", text: "Falhada", cls: "bad" };
  return { icon: "◆", text: "Em andamento", cls: "warn" };
}

function bar(label, value, max = 100) {
  const amount = pct(value, max);
  return `
    <div class="sl-bar-row">
      <div class="sl-bar-meta"><span>${label}</span><strong>${amount}%</strong></div>
      <div class="sl-bar"><span style="width:${amount}%"></span></div>
    </div>
  `;
}

function radarSvg(attributes) {
  const labels = attributes.map(attribute => attribute.label);
  const stats = attributes.map(attribute => attribute.value);
  const center = 110;
  const maxRadius = 72;
  const angleStep = (Math.PI * 2) / labels.length;

  function point(index, radius) {
    const angle = -Math.PI / 2 + index * angleStep;
    return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
  }

  function polygon(radius) {
    return labels.map((_, index) => point(index, radius).join(",")).join(" ");
  }

  const values = stats.map((v, index) => point(index, (clamp(v) / 100) * maxRadius).join(",")).join(" ");
  const spokes = labels.map((label, index) => {
    const [x, y] = point(index, maxRadius);
    const [tx, ty] = point(index, maxRadius + 24);
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" /><text x="${tx}" y="${ty}" text-anchor="middle">${label}</text>`;
  }).join("");

  return `
    <svg class="sl-radar" viewBox="0 0 220 220" role="img" aria-label="Radar de atributos">
      <polygon class="grid" points="${polygon(maxRadius)}"></polygon>
      <polygon class="grid soft" points="${polygon(maxRadius * 0.66)}"></polygon>
      <polygon class="grid soft" points="${polygon(maxRadius * 0.33)}"></polygon>
      ${spokes}
      <polygon class="shape" points="${values}"></polygon>
      ${stats.map((v, i) => {
        const [x, y] = point(i, (clamp(v) / 100) * maxRadius);
        return `<circle cx="${x}" cy="${y}" r="4"></circle>`;
      }).join("")}
    </svg>
  `;
}

function attributeRows(attributes) {
  return attributes.map(attribute => `
    <div class="sl-attr-row">
      <span>${attribute.label}</span>
      <strong>${attribute.value}</strong>
    </div>
  `).join("");
}

function weeklySquares(weekDays) {
  return weekDays.map(day => {
    const label = day.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const state = day.validDay ? "ok" : day.failedMain ? "bad" : day.completedCount > 0 ? "warn" : "empty";
    return `<div class="sl-week-day ${state}"><span>${label}</span><b>${day.completedCount}</b></div>`;
  }).join("");
}

function xpBars(weekDays) {
  return weekDays.map(day => {
    const score = dayPerformanceScore(day);
    const height = 18 + score * 0.72;
    const label = day.date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
    return `<div class="sl-xp-col"><span style="height:${height}px"></span><small>${label}<br>${score}</small></div>`;
  }).join("");
}

function dayPerformanceScore(day) {
  const mainMissions = CONFIG.missions.filter(mission => mission.main && missionApplies(mission, day.date));
  const mainDone = mainMissions.filter(mission => day.missionResults[mission.id]?.completed).length;
  const mainScore = mainMissions.length ? (mainDone / mainMissions.length) * 40 : 40;
  const taskScore = Math.min(day.completedCount, 8) / 8 * 30;
  const xpScore = Math.min(Math.max(day.xp, 0), 140) / 140 * 20;
  const consistencyScore = day.validDay ? 10 : 0;
  const penaltyImpact = Math.min(day.penalties, 50);
  return clamp(Math.round(mainScore + taskScore + xpScore + consistencyScore - penaltyImpact));
}

function periodScore(sourceDays) {
  const relevant = sourceDays.filter(day => day.key <= todayKey);
  if (!relevant.length) return 0;
  return Math.round(relevant.reduce((sum, day) => sum + dayPerformanceScore(day), 0) / relevant.length);
}

function summarizePeriod(sourceDays) {
  const relevant = sourceDays.filter(day => day.key <= todayKey);
  const xp = relevant.reduce((sum, day) => sum + day.xp, 0);
  const tasks = relevant.reduce((sum, day) => sum + day.completedCount, 0);
  const penalties = relevant.reduce((sum, day) => sum + day.penalties, 0);
  const rest = relevant.reduce((sum, day) => sum + day.restBonus, 0);
  const valid = relevant.filter(day => day.validDay).length;
  const perfect = relevant.filter(day => day.perfectDay).length;
  const lost = relevant.filter(day => day.failedMain).length;
  const score = relevant.length ? Math.round(relevant.reduce((sum, day) => sum + dayPerformanceScore(day), 0) / relevant.length) : 0;
  const mainRate = mainMissionRate(relevant);
  return { days: relevant.length, xp, tasks, penalties, rest, valid, perfect, lost, score, mainRate };
}

function mainMissionRate(sourceDays) {
  let total = 0;
  let done = 0;
  for (const day of sourceDays) {
    for (const mission of CONFIG.missions.filter(item => item.main && missionApplies(item, day.date))) {
      total++;
      if (day.missionResults[mission.id]?.completed) done++;
    }
  }
  return total ? Math.round((done / total) * 100) : 0;
}

function fullRangeDays() {
  if (!days.length) return [currentDay];
  const first = days[0].date;
  const length = Math.floor((today - first) / 86400000) + 1;
  return Array.from({ length }, (_, index) => {
    const date = addDays(first, index);
    return daysByKey.get(dateKey(date)) ?? emptyDay(date);
  });
}

function longestValidStreak(sourceDays) {
  let best = 0;
  let current = 0;
  for (const day of sourceDays.filter(day => day.key <= todayKey)) {
    if (day.validDay) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function missionStreak(id) {
  let cursor = today;
  let count = 0;
  while (true) {
    const day = daysByKey.get(dateKey(cursor));
    const mission = CONFIG.missions.find(item => item.id === id);
    if (!mission) break;
    if (!missionApplies(mission, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!day || !day.missionResults[id]?.completed) {
      if (dateKey(cursor) === todayKey) {
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function bestDayRecord(sourceDays) {
  const relevant = sourceDays.filter(day => day.key <= todayKey);
  if (!relevant.length) return null;
  return relevant
    .map(day => ({ ...day, score: dayPerformanceScore(day) }))
    .sort((a, b) => b.score - a.score || b.xp - a.xp)[0];
}

function trendLabel(value) {
  if (value > 8) return `Subindo +${value}`;
  if (value < -8) return `Caindo ${value}`;
  return `Estavel ${value >= 0 ? "+" : ""}${value}`;
}

function rankProgressPercent(totalXp, rank, upcomingRank) {
  if (!upcomingRank) return 100;
  return pct(totalXp - rank.xp, upcomingRank.xp - rank.xp);
}

function projectedDaysToNextRank(upcomingRank, avgXp) {
  if (!upcomingRank) return "MAX";
  if (avgXp <= 0) return "--";
  return Math.ceil((upcomingRank.xp - totalXp) / avgXp);
}

function recordRows(rows) {
  return rows.map(([label, value]) => `
    <div class="sl-record-row">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function emptyDay(date) {
  return {
    date,
    key: dateKey(date),
    missionResults: {},
    completedCount: 0,
    xp: 0,
    penalties: 0,
    restBonus: !isTrainingDay(date) ? 5 : 0,
    failedMain: false,
    validDay: false,
    perfectDay: false,
    pornOk: false,
    virtual: true
  };
}

async function ensureTodayDaily() {
  const path = `${CONFIG.dailyFolder}/${todayKey}.md`;
  if (app.vault.getAbstractFileByPath(path)) return false;

  const mainMission = isTrainingDay(today)
    ? "- [ ] Treino #daily/main #xp/25 #treino"
    : "- [ ] Descanso estrategico #daily/main #descanso";

  const content = `---
type: daily
date: ${todayKey}
system: solo-leveling
---

# ${todayKey} | Daily Quest

<div class="sl-note-panel">
  <div class="sl-note-title"><span class="sl-rune">S</span>SYSTEM MESSAGE</div>
  <p>Missao diaria iniciada. Complete as missoes principais para manter o dia vivo.</p>
  <div class="sl-note-grid">
    <div class="sl-note-card"><strong>Regra de validade</strong><br>3+ tarefas concluidas.</div>
    <div class="sl-note-card"><strong>Dia perfeito</strong><br>Todas as missoes completas.</div>
    <div class="sl-note-card"><strong>Falha critica</strong><br>Missao principal perdida.</div>
  </div>
</div>

## Missoes principais

${mainMission}
- [ ] Java - 1 aula + pratica #daily/main #xp/20 #java
- [ ] Sem pornografia #daily/main #xp/30 #anti-vicio

## Missoes secundarias

- [ ] Ingles - 20min #daily/secondary #xp/15 #ingles
- [ ] Japones - 15min #daily/secondary #xp/15 #japones
- [ ] Guitarra - 30min #daily/secondary #xp/20 #guitarra
- [ ] Leitura - 10 paginas #daily/secondary #xp/10 #leitura
- [ ] Dormir cedo - antes de 23:30 #daily/secondary #xp/15 #sono

<div class="sl-note-panel">
  <div class="sl-note-title"><span class="sl-rune">Q</span>Status da missao</div>
  <div class="sl-note-grid">
    <div class="sl-note-card"><strong>Tarefas concluidas</strong><br></div>
    <div class="sl-note-card"><strong>Obstaculo principal</strong><br></div>
    <div class="sl-note-card"><strong>Recompensa do dia</strong><br></div>
  </div>
</div>

## Log do cacador

-
`;

  await app.vault.create(path, content);
  new Notice(`Daily Quest criada: ${todayKey}`);
  return true;
}

function avatarResourcePath() {
  const candidates = [
    "00 - System/Assets/player-avatar.jpg",
    "00 - System/Assets/player-avatar.png",
    "00 - System/Assets/player-avatar.webp",
    "00 - System/Assets/player-avatar.jpeg"
  ];
  for (const path of candidates) {
    const file = app.vault.getAbstractFileByPath(path);
    if (file) return app.vault.adapter.getResourcePath(file.path);
  }
  return null;
}

function openButton(label, path) {
  return `<button class="sl2-report-link" data-open-path="${path}">${label}</button>`;
}

const createdTodayDaily = await ensureTodayDaily();
const pages = dv.pages(`"${CONFIG.dailyFolder}"`).array();
const days = pages.map(readDay).filter(Boolean).sort((a, b) => a.date - b.date);
const daysByKey = new Map(days.map(day => [day.key, day]));
const currentDay = daysByKey.get(todayKey) ?? emptyDay(today);
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(today, i - 6);
  return daysByKey.get(dateKey(date)) ?? emptyDay(date);
});
const previousWeekDays = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(today, i - 13);
  return daysByKey.get(dateKey(date)) ?? emptyDay(date);
});
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const monthDays = Array.from({ length: today.getDate() }, (_, i) => {
  const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
  return daysByKey.get(dateKey(date)) ?? emptyDay(date);
});

const totalXpRaw = days.reduce((sum, day) => sum + day.xp, 0);
const totalXp = Math.max(0, totalXpRaw);
const previousXp = currentDay ? Math.max(0, totalXpRaw - currentDay.xp) : totalXp;
const level = Math.floor(totalXp / CONFIG.xpPerLevel) + 1;
const previousLevel = Math.floor(previousXp / CONFIG.xpPerLevel) + 1;
const xpCurrent = totalXp % CONFIG.xpPerLevel;
const rank = getRank(totalXp);
const upcomingRank = nextRank(totalXp);
const streak = computeStreak(daysByKey);
const consistentDays = days.filter(day => day.validDay).length;
const perfectDays = days.filter(day => day.perfectDay).length;
const totalPenalties = days.reduce((sum, day) => sum + day.penalties, 0);
const totalRestBonus = days.reduce((sum, day) => sum + day.restBonus, 0);
const lostDays = days.filter(day => day.failedMain).length;
const levelUp = level > previousLevel;
const nextRankText = upcomingRank ? `${upcomingRank.name} em ${upcomingRank.xp - totalXp} XP` : "Rank maximo";
const xpPct = pct(xpCurrent, CONFIG.xpPerLevel);
const todayCompletion = currentDay ? pct(currentDay.completedCount, 8) : 0;
const weekXp = weekDays.reduce((sum, day) => sum + Math.max(day.xp, 0), 0);
const weekPerformance = periodScore(weekDays);
const previousWeekPerformance = periodScore(previousWeekDays);
const weekTrend = weekPerformance - previousWeekPerformance;
const monthPerformance = periodScore(monthDays);
const rangeDays = fullRangeDays();
const bestDay = bestDayRecord(rangeDays);
const longestStreak = longestValidStreak(rangeDays);
const pornStreak = missionStreak("porn");
const javaStreak = missionStreak("java");
const trainingStreak = missionStreak("treino");
const weekSummary = summarizePeriod(weekDays);
const monthSummary = summarizePeriod(monthDays);
const lifetimeSummary = summarizePeriod(rangeDays);
const avgXp7 = Math.round(weekSummary.xp / Math.max(weekSummary.days, 1));
const avgXp30 = Math.round(monthSummary.xp / Math.max(monthSummary.days, 1));
const rankProgress = rankProgressPercent(totalXp, rank, upcomingRank);
const etaRank = projectedDaysToNextRank(upcomingRank, avgXp7);
const recoveryRate = pct(monthSummary.rest, Math.max(monthSummary.days * 5, 1));
const riskScore = clamp(100 - monthSummary.mainRate + monthSummary.penalties / Math.max(monthSummary.days, 1) * 2 + monthSummary.lost * 8);
const avatarUrl = avatarResourcePath();
const avatarHtml = avatarUrl
  ? `<img src="${avatarUrl}" alt="Player avatar">`
  : `<span>SL</span>`;

const radarAttributes = buildAttributeRadar();

const missionRows = ["treino", "java", "porn", "ingles", "japones", "guitarra", "leitura", "dormir"]
  .map(id => {
    const mission = CONFIG.missions.find(m => m.id === id);
    const status = missionStatus(currentDay, id);
    return `<div class="sl-mission ${status.cls}"><span>${mission.label}</span><strong>${status.icon} ${status.text}</strong></div>`;
  }).join("");

const alerts = [];
if (createdTodayDaily) alerts.push(`DAILY QUEST CRIADA AUTOMATICAMENTE - ${todayKey}.`);
if (currentDay?.virtual) alerts.push(`NOVA DAILY QUEST DISPONIVEL - abra [[01 - Daily/${todayKey}|${todayKey}]] para iniciar o dia.`);
if (currentDay?.failedMain) alerts.push("DIA PERDIDO - missao principal falhou.");
if (currentDay && isPast(currentDay.date) && !currentDay.pornOk) alerts.push("FALHA DETECTADA - Sem pornografia nao concluida.");
if (totalPenalties > 0) alerts.push(`Penalidades acumuladas: -${totalPenalties} XP.`);

const css = `
<style>
.sl2-shell {
  --bg: #090712;
  --panel: rgba(17, 14, 32, 0.92);
  --panel2: rgba(25, 20, 45, 0.9);
  --line: rgba(220, 170, 255, 0.26);
  --line2: rgba(239, 108, 255, 0.36);
  --text: #f7efff;
  --muted: #c9b9dc;
  --pink: #f058ff;
  --purple: #a66cff;
  --violet: #7134d8;
  --good: #b9ffdd;
  --warn: #ffe6a7;
  --bad: #ff8da1;
  position: relative;
  overflow: hidden;
  color: var(--text);
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    radial-gradient(circle at 18% 10%, rgba(240, 88, 255, 0.18), transparent 28%),
    radial-gradient(circle at 86% 20%, rgba(127, 75, 255, 0.16), transparent 26%),
    linear-gradient(180deg, #141020 0%, #080711 100%);
  box-shadow: 0 0 38px rgba(210, 86, 255, 0.18), inset 0 0 36px rgba(255, 255, 255, 0.03);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.sl2-shell * { box-sizing: border-box; }
.sl2-shell:before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image:
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, black, transparent 76%);
}
.sl2-top {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.sl2-brand h1 {
  margin: 0;
  color: #fff;
  font-size: 34px;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(240, 88, 255, 0.7), 0 3px 0 rgba(89, 43, 135, 0.9);
}
.sl2-brand p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  text-transform: uppercase;
}
.sl2-pill {
  border: 1px solid var(--line2);
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(40, 30, 62, 0.72);
  box-shadow: inset 0 0 14px rgba(240, 88, 255, 0.12);
  color: #f6d7ff;
  font-weight: 800;
}
.sl2-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.25fr 1fr;
  gap: 14px;
}
.sl2-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--panel), rgba(9, 7, 18, 0.92));
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.26), inset 0 0 20px rgba(255, 255, 255, 0.025);
  padding: 14px;
  min-width: 0;
}
.sl2-card h2 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0;
}
.sl2-avatar {
  display: grid;
  place-items: center;
  width: 128px;
  height: 128px;
  margin: 0 auto 12px;
  border-radius: 50%;
  border: 4px solid #d26cff;
  background:
    radial-gradient(circle at 50% 38%, #32213f 0 20%, transparent 21%),
    radial-gradient(circle at 50% 54%, #20172d 0 31%, transparent 32%),
    linear-gradient(135deg, #7850b8, #20142e 58%, #0b0814);
  box-shadow: 0 0 0 6px rgba(210, 108, 255, 0.16), 0 0 22px rgba(240, 88, 255, 0.45);
  color: #f8d9ff;
  font-size: 34px;
  font-weight: 900;
  overflow: hidden;
  position: relative;
}
.sl2-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sl2-avatar span {
  position: relative;
  z-index: 1;
}
.sl2-level {
  text-align: center;
  font-size: 18px;
  font-weight: 900;
}
.sl2-class {
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 12px;
}
.sl2-statline {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  margin-top: 10px;
}
.sl2-statline strong { color: var(--text); }
.sl2-report-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 12px;
}
.sl2-report-link {
  display: block;
  text-align: center;
  text-decoration: none !important;
  color: #fff !important;
  font-size: 11px;
  font-weight: 900;
  border: 1px solid rgba(240, 88, 255, 0.42);
  border-radius: 9px;
  padding: 7px 4px;
  background: linear-gradient(135deg, rgba(240, 88, 255, 0.28), rgba(113, 52, 216, 0.22));
  box-shadow: 0 0 14px rgba(240, 88, 255, 0.18);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sl2-report-link:hover {
  border-color: rgba(255, 157, 255, 0.72);
  box-shadow: 0 0 18px rgba(240, 88, 255, 0.36);
}
.sl-bar-row { margin: 10px 0; }
.sl-bar-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 5px;
}
.sl-bar-meta strong { color: #fff; }
.sl-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.11);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}
.sl-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--purple), var(--pink), #ff9df7);
  box-shadow: 0 0 14px rgba(240, 88, 255, 0.72);
}
.sl2-rank {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  align-items: center;
}
.sl2-rank-badge {
  display: grid;
  place-items: center;
  height: 72px;
  border-radius: 18px;
  color: #fff;
  font-size: 42px;
  font-weight: 950;
  background: radial-gradient(circle, #f058ff, #7134d8 58%, #241337);
  box-shadow: 0 0 20px rgba(240, 88, 255, 0.5);
}
.sl-radar {
  width: 100%;
  min-height: 260px;
  overflow: visible;
}
.sl-radar .grid {
  fill: rgba(171, 103, 255, 0.08);
  stroke: rgba(226, 174, 255, 0.26);
  stroke-width: 1;
}
.sl-radar .soft { fill: transparent; }
.sl-radar line {
  stroke: rgba(226, 174, 255, 0.16);
  stroke-width: 1;
}
.sl-radar text {
  fill: #d9c4ed;
  font-size: 10px;
}
.sl-radar .shape {
  fill: rgba(240, 88, 255, 0.35);
  stroke: #ff91ff;
  stroke-width: 2;
  filter: drop-shadow(0 0 8px rgba(240, 88, 255, 0.75));
}
.sl-radar circle {
  fill: #fff;
  stroke: #f058ff;
  stroke-width: 2;
}
.sl-attr-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  color: var(--muted);
  font-size: 12px;
}
.sl-attr-row strong {
  color: #fff;
  font-size: 13px;
}
.sl2-side-stack {
  display: grid;
  gap: 12px;
}
.sl2-mini {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 10px;
  align-items: center;
}
.sl2-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #f058ff, #7134d8);
  box-shadow: 0 0 14px rgba(240, 88, 255, 0.36);
}
.sl2-big {
  font-size: 22px;
  font-weight: 950;
}
.sl2-muted { color: var(--muted); font-size: 12px; }
.sl2-wide {
  grid-column: span 2;
}
.sl2-bottom {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 14px;
  margin-top: 14px;
}
.sl-mission {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--muted);
}
.sl-mission strong { color: #fff; }
.sl-mission.ok strong { color: var(--good); }
.sl-mission.warn strong { color: var(--warn); }
.sl-mission.bad strong { color: var(--bad); }
.sl-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.sl-week-day {
  min-width: 0;
  min-height: 50px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.055);
  display: grid;
  place-items: center;
  color: var(--muted);
  padding: 5px 2px;
  overflow: hidden;
}
.sl-week-day span {
  max-width: 100%;
  font-size: 9px;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.sl-week-day b {
  font-size: 17px;
  line-height: 1;
}
.sl-week-day.ok { background: rgba(240, 88, 255, 0.28); border-color: rgba(240, 88, 255, 0.55); color: #fff; }
.sl-week-day.warn { background: rgba(255, 202, 92, 0.15); }
.sl-week-day.bad { background: rgba(255, 80, 120, 0.16); border-color: rgba(255, 80, 120, 0.4); }
.sl-xp-chart {
  height: 150px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
  padding-top: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.18);
}
.sl-xp-col {
  height: 130px;
  display: grid;
  align-items: end;
  gap: 6px;
  text-align: center;
}
.sl-xp-col span {
  display: block;
  min-height: 8px;
  border-radius: 10px 10px 3px 3px;
  background: linear-gradient(180deg, #ff5cff, #6b3ac5);
  box-shadow: 0 0 14px rgba(240, 88, 255, 0.6);
}
.sl-xp-col small { color: var(--muted); font-size: 10px; }
.sl-donut {
  width: 164px;
  height: 164px;
  margin: 8px auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(var(--pink) ${xpPct}%, rgba(255,255,255,0.09) 0);
  box-shadow: 0 0 20px rgba(240, 88, 255, 0.38);
}
.sl-donut:before {
  content: "";
  position: absolute;
}
.sl-donut-inner {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: #100c1d;
  color: #fff;
  text-align: center;
  font-weight: 950;
}
.sl-donut-inner span { display: block; color: var(--muted); font-size: 11px; font-weight: 700; }
.sl2-alert {
  margin-top: 10px;
  border: 1px solid rgba(255, 90, 130, 0.4);
  background: rgba(96, 12, 36, 0.34);
  color: #ffd1dc;
  padding: 10px;
  border-radius: 10px;
  font-weight: 800;
}
.sl2-good {
  margin-top: 10px;
  border: 1px solid rgba(185, 255, 221, 0.28);
  background: rgba(35, 90, 80, 0.18);
  color: #d7fff0;
  padding: 10px;
  border-radius: 10px;
}
.sl2-levelup {
  margin: 12px 0 0;
  padding: 10px;
  text-align: center;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(90deg, #7134d8, #f058ff, #7134d8);
  box-shadow: 0 0 18px rgba(240, 88, 255, 0.65);
  font-weight: 950;
}
.sl-record-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.sl-record-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--muted);
  font-size: 12px;
}
.sl-record-row strong {
  color: #fff;
  text-align: right;
}
.sl2-metric-kpi {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 10px 0;
}
.sl2-kpi {
  border: 1px solid rgba(240, 88, 255, 0.2);
  border-radius: 12px;
  padding: 10px;
  background: rgba(255,255,255,0.045);
}
.sl2-kpi span {
  display: block;
  color: var(--muted);
  font-size: 11px;
}
.sl2-kpi strong {
  display: block;
  color: #fff;
  font-size: 20px;
  margin-top: 4px;
}
@media (min-width: 1200px) {
  .sl2-brand h1 { font-size: 42px; }
  .sl2-avatar { width: 156px; height: 156px; }
  .sl-radar { min-height: 320px; }
  .sl-xp-chart { height: 190px; }
  .sl-xp-col { height: 168px; }
}
@media (max-width: 900px) {
  .sl2-shell {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding: 18px;
  }
  .sl2-grid, .sl2-bottom { grid-template-columns: 1fr; }
  .sl-record-grid { grid-template-columns: 1fr; }
  .sl2-wide { grid-column: span 1; }
  .sl2-brand h1 { font-size: 26px; }
}
</style>
`;

const html = `
<div class="sl2-shell">
  <div class="sl2-top">
    <div class="sl2-brand">
      <h1>Auron System</h1>
      <p>Habit & Quest Tracker</p>
    </div>
    <div class="sl2-pill">Rank ${rank.name} // Level ${level}</div>
  </div>

  <div class="sl2-grid">
    <section class="sl2-card">
      <div class="sl2-avatar">${avatarHtml}</div>
      <div class="sl2-level">Bankai</div>
      <div class="sl2-class">Level 2</div>
      ${bar("HP / Disciplina", todayCompletion, 100)}
      ${bar(`XP ${xpCurrent}/${CONFIG.xpPerLevel}`, xpCurrent, CONFIG.xpPerLevel)}
      <div class="sl2-statline"><span>XP total</span><strong>${totalXp}</strong></div>
      <div class="sl2-statline"><span>Moedas</span><strong>${(consistentDays * 120 + perfectDays * 300).toLocaleString("pt-BR")}</strong></div>
      <div class="sl2-report-links">
        ${openButton("Semana", "04 - Stats/WEEKLY PERFORMANCE.md")}
        ${openButton("Mes", "04 - Stats/MONTHLY PERFORMANCE.md")}
        ${openButton("Geral", "04 - Stats/PERFORMANCE OVERVIEW.md")}
        ${openButton("Desktop", "00 - System/PLAYER STATUS DESKTOP.md")}
      </div>
    </section>

    <section class="sl2-card">
      <h2>Attribute Radar</h2>
      ${radarSvg(radarAttributes)}
      ${attributeRows(radarAttributes)}
    </section>

    <section class="sl2-side-stack">
      <div class="sl2-card sl2-mini">
        <div class="sl2-icon">🔥</div>
        <div><div class="sl2-big">${streak} dias</div><div class="sl2-muted">Assignment streak</div></div>
      </div>
      <div class="sl2-card sl2-mini">
        <div class="sl2-icon">🏆</div>
        <div><div class="sl2-big">${nextRankText}</div><div class="sl2-muted">Proximo rank</div></div>
      </div>
      <div class="sl2-card">
        <h2>Weekly Matrix</h2>
        <div class="sl-week">${weeklySquares(weekDays)}</div>
      </div>
      <div class="sl2-card">
        <h2>Week Performance</h2>
        <div class="sl2-big">${weekPerformance}/100</div>
        ${bar("Desempenho semanal", weekPerformance, 100)}
        <div class="sl2-muted">${weekXp} XP coletados</div>
      </div>
    </section>

    <section class="sl2-card">
      <h2>Skill Tracker</h2>
      ${bar("Java", completionRate("java"))}
      ${bar("Anti-vicio", completionRate("porn"))}
      ${bar("Treino", completionRate("treino"))}
      ${bar("Idiomas", completionRate(["ingles", "japones"]))}
      ${bar("Guitarra", completionRate("guitarra"))}
      ${bar("Leitura", completionRate("leitura"))}
    </section>

    <section class="sl2-card sl2-wide">
      <h2>Progression Graph // Semana</h2>
      <div class="sl-xp-chart">${xpBars(weekDays)}</div>
      <div class="sl2-statline"><span>Score semanal</span><strong>${weekPerformance}/100</strong></div>
      <div class="sl2-statline"><span>Dias perfeitos</span><strong>${weekDays.filter(day => day.perfectDay).length}</strong></div>
    </section>

    <section class="sl2-card">
      <h2>Goal Completion</h2>
      <div class="sl-donut"><div class="sl-donut-inner">XP<br>${xpPct}%<span>${xpCurrent}/${CONFIG.xpPerLevel}</span></div></div>
    </section>
  </div>

  <div class="sl2-bottom">
    <section class="sl2-card">
      <h2>Mission Status ${currentDay ? `// ${currentDay.key}` : ""}</h2>
      ${missionRows}
      ${currentDay && !isTrainingDay(currentDay.date) ? `<div class="sl2-good">Recuperacao ativa - descanso estrategico reconhecido pelo sistema.</div>` : ""}
      ${levelUp ? `<div class="sl2-levelup">LEVEL UP</div>` : ""}
      ${alerts.map(text => `<div class="sl2-alert">${text}</div>`).join("")}
    </section>

    <section class="sl2-card">
      <h2>System Report</h2>
      <div class="sl2-rank">
        <div class="sl2-rank-badge">${rank.name}</div>
        <div>
          ${bar("Rank progress", upcomingRank ? totalXp - rank.xp : 100, upcomingRank ? upcomingRank.xp - rank.xp : 100)}
          <div class="sl2-statline"><span>Descanso estrategico</span><strong>+${totalRestBonus} XP</strong></div>
          <div class="sl2-statline"><span>Dias perdidos</span><strong>${lostDays}</strong></div>
          <div class="sl2-statline"><span>Penalidades</span><strong>-${totalPenalties} XP</strong></div>
          <div class="sl2-statline"><span>Progresso de rank</span><strong>${rankProgress}%</strong></div>
          <div class="sl2-statline"><span>ETA proximo rank</span><strong>${etaRank} dias</strong></div>
        </div>
      </div>
    </section>
  </div>

  <div class="sl-record-grid">
    <section class="sl2-card">
      <h2>Player Records</h2>
      ${recordRows([
        ["Maior streak", `${longestStreak} dias`],
        ["Streak atual", `${streak} dias`],
        ["Melhor dia", bestDay ? `${bestDay.key} // ${bestDay.score}` : "--"],
        ["Maior XP/dia", bestDay ? `${Math.max(bestDay.xp, 0)} XP` : "--"],
        ["Dias perfeitos", perfectDays],
        ["Total de tarefas", lifetimeSummary.tasks]
      ])}
    </section>

    <section class="sl2-card">
      <h2>Trend Analysis</h2>
      <div class="sl2-metric-kpi">
        <div class="sl2-kpi"><span>Semana</span><strong>${weekPerformance}/100</strong></div>
        <div class="sl2-kpi"><span>Mes</span><strong>${monthPerformance}/100</strong></div>
      </div>
      ${recordRows([
        ["Tendencia semanal", trendLabel(weekTrend)],
        ["Media XP 7d", `${avgXp7}/dia`],
        ["Media XP mes", `${avgXp30}/dia`],
        ["Missoes principais 7d", `${weekSummary.mainRate}%`],
        ["Missoes principais mes", `${monthSummary.mainRate}%`],
        ["Risco operacional", `${Math.round(riskScore)}/100`]
      ])}
    </section>

    <section class="sl2-card">
      <h2>Discipline Protocol</h2>
      <div class="sl2-metric-kpi">
        <div class="sl2-kpi"><span>Anti-vicio</span><strong>${pornStreak}d</strong></div>
        <div class="sl2-kpi"><span>Java</span><strong>${javaStreak}d</strong></div>
      </div>
      ${recordRows([
        ["Treino streak", `${trainingStreak} sessoes`],
        ["Recuperacao ativa", `${recoveryRate}%`],
        ["Descanso mes", `+${monthSummary.rest} XP`],
        ["Penalidade mes", `-${monthSummary.penalties} XP`],
        ["Dias validos mes", `${monthSummary.valid}/${monthSummary.days}`],
        ["Dias perdidos mes", monthSummary.lost]
      ])}
    </section>
  </div>
</div>
`;

dv.container.innerHTML = css + html;
dv.container.querySelectorAll("[data-open-path]").forEach(button => {
  button.addEventListener("click", async event => {
    const path = event.currentTarget.getAttribute("data-open-path");
    await app.workspace.openLinkText(path, "", false);
  });
});
```
