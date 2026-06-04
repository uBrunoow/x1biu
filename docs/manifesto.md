---
title: Manifesto
tags:
  - projeto
  - visão-geral
aliases:
  - Visão Geral
  - x1biu
---

# Manifesto

> Visao geral, escopo e proposito do projeto.

Veja também: [[backend/manifesto|Backend]] · [[frontend/manifesto|Frontend]] · [[funcionalidades]] · [[fluxos]] · [[glossario]]

---

## O que é o x1biu

O x1biu é um app de batalha 1v1 de assobios. Um jogador entra na fila, é pareado com outro, uma música toca simultaneamente para ambos e cada um assobia acompanhando a melodia. O microfone do browser capta o pitch em tempo real, que é comparado com a referência da música — quem assobiar com maior precisão vence a partida e sobe no ranking global.

O projeto é declaradamente inútil e feito pra ser divertido.

---

## Como funciona

```
Jogador A entra na fila
Jogador B entra na fila
        │
        ▼ matchmaking
   Partida criada
        │
        ▼ música toca para os dois
   Ambos assobiam (microfone)
        │
        ▼ pitch comparado com referência
   Pontuação calculada em tempo real
        │
        ▼ música termina
   Vencedor determinado → ranking atualizado
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django + DRF + Uvicorn |
| Tempo real | Django Channels (WebSocket) |
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| Banco | PostgreSQL |
| Fila | Celery + Redis |
| Infra | Docker Compose |
| API Docs | drf-spectacular + scalar |

---

## Repositório

```
x1biu/
├── backend/        # Django (API + workers + channels)
├── frontend/       # Next.js (interface)
├── docker/         # docker-compose.dev.yml + prod
├── docs/           # Documentação do projeto
├── backlog/        # Backlog.md
└── Makefile        # Comandos de operação
```
