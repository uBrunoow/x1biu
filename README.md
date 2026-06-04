# x1biu — batalha de assobios

App de batalha 1v1 de assobios. Dois jogadores entram na fila, são pareados, uma música toca simultaneamente para ambos e cada um assobia acompanhando a melodia. O pitch captado pelo microfone é comparado com a referência da música em tempo real — quem assobiar com maior precisão vence e sobe no ranking.

O projeto é declaradamente inútil e feito pra ser divertido.

## Como funciona

```
Jogador A entra na fila
Jogador B entra na fila
        │
        ▼ matchmaking (Celery Beat, 5s)
   Partida criada
        │
        ▼ música toca para os dois via WebSocket
   Ambos assobiam (microfone do browser)
        │
        ▼ pitch comparado com referência frame a frame
   Pontuação calculada em tempo real
        │
        ▼ música termina
   Vencedor determinado → ranking atualizado
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5.2 + DRF + Daphne (ASGI) |
| Tempo real | Django Channels (WebSocket) |
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| Banco | PostgreSQL 16 |
| Fila | Celery 5.6 + Redis |
| Infra | Docker Compose |
| API Docs | drf-spectacular + scalar |

## Estrutura

```
x1biu/
├── backend/        # Django (API + workers + channels)
├── frontend/       # Next.js
├── docker/         # docker-compose.dev.yml
├── docs/           # Documentação (vault Obsidian)
├── backlog/        # Backlog.md
├── .env.example
└── Makefile
```

## Setup

### Pré-requisitos

- Python 3.13+ com [uv](https://docs.astral.sh/uv/)
- Node.js com [pnpm](https://pnpm.io/)
- Docker + Docker Compose

### Instalação

```bash
cp .env.example .env      # configure as variáveis
make install              # instala dependências backend e frontend
make rundb                # sobe postgres, redis, celery via Docker
make migrate              # roda as migrations
make createsuperuser      # cria admin (opcional)
```

### Rodando em desenvolvimento

```bash
make backend              # servidor Django na porta 8000
make frontend             # Next.js na porta 3000
```

## Comandos úteis

```bash
make test        # testes do backend (pytest)
make qa          # testes + build frontend
make lint        # linters (ruff + eslint)
make format      # formatação (ruff + prettier)
make api         # gera schema OpenAPI e clientes TypeScript
make migrate     # aplica migrations
make stopdb      # para os containers Docker
```

## API

Documentação interativa disponível em `http://localhost:8000/scalar/` (scalar UI sobre OpenAPI).

## Licença

Uso pessoal / experimental. Sem licença formal.
