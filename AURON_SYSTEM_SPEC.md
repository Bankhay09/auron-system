# Auron System — Specification

## Objetivo
Criar um habit tracker gamificado inspirado em sistemas de RPG, Solo Leveling e dashboards futuristas.

## Módulos principais

### 1. Player Status
- Avatar
- Nome do jogador
- Level
- Rank
- HP / Disciplina
- XP atual
- XP total
- Moedas
- Radar de atributos
- Skill tracker
- Weekly matrix
- Progression graph

### 2. Daily Quest
- Lista de hábitos diários
- Tarefas obrigatórias
- Tarefas opcionais
- XP por tarefa
- Botão concluir tarefa
- Botão encerrar dia
- Aviso de punição se falhar
- Recompensa se completar

### 3. Side Quests
- Quests opcionais
- Quests únicas
- Quests recorrentes
- XP extra
- Moedas extras

### 4. Weekly Performance
- XP da semana
- Score semanal
- Dias válidos
- Dias perfeitos
- Gráfico semanal
- Habit graph

### 5. Monthly Performance
- XP mensal
- Score mensal
- Calendário mensal
- XP diário
- Dias perfeitos
- Penalidades
- Descanso

### 6. Performance Overview
- Semana
- Mês
- Total
- Gráficos consolidados

### 7. System Audit
- Data
- Arquivo
- Tarefas
- XP
- Dia válido
- Falha main

## Sistema de ranks
E, D, C, B, A, S, SS

## Estados visuais
- Normal
- Quest completa
- Quest falhada
- Level up
- Rank up
- Penalidade
- Recompensa
- Modo noturno
- Modo boss fight

## Stack alvo
- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- GSAP
- Recharts
- Supabase
- PWA

## Estratégia de evolução
- V1: Dashboard + Daily Quest + XP + hábitos + dados mockados.
- V2: Supabase + login + dados reais + estatísticas.
- V3: Assets customizados + efeitos + mudança de tema + animações cinematográficas.
