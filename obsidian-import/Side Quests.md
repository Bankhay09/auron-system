# Side Quests

<div class="sl-note-panel">
  <div class="sl-note-title"><span class="sl-rune">Q</span>Long Term Quest Board</div>
  <p>Missoes de longo prazo rastreadas por Tasks e Dataview. O HUD principal continua calculando XP pelas Daily Notes.</p>
</div>

## Anti-vicio

- [ ] 7 dias sem pornografia #sidequest #anti-vicio
  - [ ] Dia 1 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 2 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 3 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 4 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 5 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 6 sem pornografia #sidequest/step #anti-vicio
  - [ ] Dia 7 sem pornografia #sidequest/step #anti-vicio

## Java

- [ ] 5 dias estudando Java #sidequest #java
  - [ ] Java dia 1 #sidequest/step #java
  - [ ] Java dia 2 #sidequest/step #java
  - [ ] Java dia 3 #sidequest/step #java
  - [ ] Java dia 4 #sidequest/step #java
  - [ ] Java dia 5 #sidequest/step #java

## Treino

- [ ] 3 treinos na semana #sidequest #treino
  - [ ] Treino semanal 1 #sidequest/step #treino
  - [ ] Treino semanal 2 #sidequest/step #treino
  - [ ] Treino semanal 3 #sidequest/step #treino

## Guitarra

- [ ] Aprender musica completa na guitarra #sidequest #guitarra
  - [ ] Escolher musica #sidequest/step #guitarra
  - [ ] Aprender intro #sidequest/step #guitarra
  - [ ] Aprender verso #sidequest/step #guitarra
  - [ ] Aprender refrao #sidequest/step #guitarra
  - [ ] Tocar musica inteira sem parar #sidequest/step #guitarra

## Painel de Side Quests

```tasks
not done
tags include #sidequest
sort by path
```

```dataviewjs
const tasks = dv.pages('"02 - Quests"').file.tasks
  .where(t => String(t.text).toLowerCase().includes("#sidequest"));

const total = tasks.length;
const done = tasks.where(t => t.completed).length;
const pct = total ? Math.round((done / total) * 100) : 0;

dv.container.innerHTML = `
<div class="sl-note-panel">
  <div class="sl-note-title"><span class="sl-rune">XP</span>Side Quest Completion</div>
  <p>${done} / ${total} objetivos completos (${pct}%).</p>
  <progress value="${done}" max="${Math.max(total, 1)}"></progress>
</div>
`;
```
