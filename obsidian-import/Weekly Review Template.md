---
type: weekly
system: solo-leveling
---

# Weekly Review | <% tp.date.now("YYYY-[W]WW") %>

<div class="sl-note-panel">
  <div class="sl-note-title"><span class="sl-rune">W</span>Weekly System Report</div>
  <p>Auditoria semanal de evolucao, falhas, consistencia e ajustes de ambiente.</p>
</div>

## System Report

```dataview
TASK
FROM "01 - Daily"
WHERE completed
WHERE file.day >= date(<% tp.date.now("YYYY-MM-DD", -7) %>)
SORT file.day ASC
```

## Analise

- Vitoria da semana:
- Falha critica:
- Missao principal da proxima semana:
- Ajuste de ambiente:
