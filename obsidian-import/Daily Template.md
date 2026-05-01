---
type: daily
date: <% tp.date.now("YYYY-MM-DD") %>
system: solo-leveling
---

# <% tp.date.now("YYYY-MM-DD") %> | Daily Quest

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

<%*
const n = tp.date.now("E"); // 1=segunda ... 7=domingo
if (["1", "3", "5"].includes(n)) {
  tR += "- [ ] Treino #daily/main #xp/25 #treino\n";
} else {
  tR += "- [ ] Descanso estrategico #daily/main #descanso\n";
}
%>- [ ] Java - 1 aula + pratica #daily/main #xp/20 #java
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
