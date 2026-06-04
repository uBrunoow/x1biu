---
title: Backend API
tags:
  - backend
  - api
  - endpoints
aliases:
  - Endpoints
  - REST API
---

# Backend API

> Endpoints e contratos REST.

Veja também: [[backend/entidades]] · [[backend/services]] · [[backend/fluxos]] · [[funcionalidades]]

Base path configurado via `config/urls.py`:

| Prefixo | App |
|---------|-----|
| `/queue/` | `apps.matches` |
| `/matches/` | `apps.matches` |
| `/ranking/` | `apps.management` |
| `/songs/` | `apps.songs` |
| `/admin/` | Django Admin |
| `/scalar/` | Documentação OpenAPI (drf-spectacular + scalar) |

---

## QueueView

**Endpoints:**
- `POST /queue/join/` — entra na fila de matchmaking
- `DELETE /queue/leave/` — sai da fila

Requer autenticação. Cria ou remove o [[backend/entidades#QueueEntry|QueueEntry]] do jogador.

**Resposta (join):**
- `201 Created` `{"status": "queued", "position": 1}` — na fila
- `400 Bad Request` `{"detail": "Você já está na fila"}` — entrada duplicada
- `400 Bad Request` `{"detail": "Você já está em uma partida ativa"}` — partida em andamento

---

## MatchViewSet

**Endpoint base:** `/matches/`

| Ação | Método | URL | Descrição |
|------|--------|-----|-----------|
| list | GET | `/matches/` | Partidas do jogador autenticado |
| retrieve | GET | `/matches/{id}/` | Detalhe com participantes e pontuações |

**Filtros:** `status`

---

## RankingView

**Endpoint:** `GET /ranking/`

Lista pública de jogadores ordenada por vitórias (desc), depois por winrate (desc).

**Resposta:** `[{nickname, wins, losses, winrate}]`

Não requer autenticação.

---

## SongViewSet

**Endpoint base:** `/songs/`

| Ação | Método | URL | Descrição |
|------|--------|-----|-----------|
| list | GET | `/songs/` | Lista músicas ativas |
| retrieve | GET | `/songs/{id}/` | Detalhe com `pitch_reference` |

Não requer autenticação.
