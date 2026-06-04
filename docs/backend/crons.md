---
title: Backend Crons
tags:
  - backend
  - celery
  - tasks
  - filas
aliases:
  - Tasks
  - Celery Tasks
  - Workers
---

# Backend Crons

> Tarefas assíncronas e rotinas Celery.

Broker: **Redis** (`CELERY_BROKER_URL`). Scheduler: **Celery Beat** com `DatabaseScheduler`.

Veja também: [[backend/services]] · [[backend/entidades]] · [[backend/fluxos]]

---

## process_matchmaking

**App:** `apps.matches`
**Fila:** `matchmaking`
**Agendamento:** periódico (ex: a cada 5 segundos via Celery Beat)

Checa a [[backend/entidades#QueueEntry|fila]] e cria partidas quando há pelo menos dois jogadores aguardando. Chama [[backend/services#MatchmakingService|MatchmakingService.run()]] em loop até esvaziar a fila ou restar menos de 2 jogadores.

**Fluxo:**
1. Conta `QueueEntry`s ordenadas por `joined_at`
2. Enquanto `count >= 2`: instancia `MatchmakingService` e chama `.run()`
3. Cada chamada cria uma partida, remove 2 entradas da fila e notifica os jogadores via WebSocket

---

## CELERY_BEAT_SCHEDULE

| Task | Intervalo |
|------|-----------|
| `process_matchmaking` | 5 segundos |
