---
title: Backend Manifesto
tags:
  - backend
  - stack
  - infra
aliases:
  - Stack Backend
---

# Backend Manifesto

> Stack, bibliotecas e estrutura do backend Django.

Veja também: [[manifesto]] · [[backend/entidades]] · [[backend/api]] · [[backend/services]] · [[backend/crons]]

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Django | 5.2.x |
| API REST | Django REST Framework | 3.16.x |
| Tempo real | Django Channels | 4.x |
| Servidor ASGI | Uvicorn | — |
| Banco de dados | PostgreSQL 16 | — |
| Broker / Cache | Redis | — |
| Worker assíncrono | Celery | 5.6.x |
| Autenticação | JWT (SimpleJWT) | — |
| Admin | Django Unfold | 0.40.x |
| Documentação API | drf-spectacular + scalar | — |
| Filtragem | django-filter | 25.x |
| CORS | django-cors-headers | 4.9.x |
| Variáveis de ambiente | django-environ | 0.13.x |
| Python | 3.13+ | — |
| Gerenciador de pacotes | uv | — |

---

## Estrutura de Apps

```
backend/
├── config/              # Configuração global Django
│   ├── settings/
│   │   ├── base.py      # Settings compartilhados
│   │   ├── dev.py       # Settings de desenvolvimento
│   │   └── prod.py      # Settings de produção
│   ├── urls.py          # Roteamento raiz
│   ├── routing.py       # Roteamento WebSocket (Channels)
│   ├── celery.py        # Configuração do Celery
│   ├── asgi.py          # Entry point ASGI
│   └── utils/           # BaseModel, helpers, admin base
│
└── apps/
    ├── management/      # User customizado (email login + nickname + stats)
    ├── songs/           # Song (catálogo de músicas com pitch reference)
    └── matches/         # QueueEntry, Match, MatchParticipant, consumers WebSocket
```

---

## Infraestrutura Docker

Serviços definidos em `docker/docker-compose.dev.yml`:

| Serviço | Imagem | Porta | Descrição |
|---------|--------|-------|-----------|
| `postgres` | postgres:16-alpine | 5432 | Banco de dados principal |
| `redis` | redis:7-alpine | 6379 | Broker Celery + channel layer Channels |
| `celery` | Dockerfile local | — | Worker Celery (matchmaking) |
| `celery-beat` | Dockerfile local | — | Scheduler (process_matchmaking periódico) |
| `pgadmin` | dpage/pgadmin4 | 5050 | Interface web para PostgreSQL |

---

## Configurações Relevantes

- **Auth:** JWT com `ACCESS_TOKEN_LIFETIME = 7 dias`. Login por e-mail (`AUTH_USER_MODEL = "management.User"`).
- **Channels layer:** Redis (`CHANNEL_LAYERS` com `RedisChannelLayer`)
- **Throttling:** `100/minute` (anon), `1000/minute` (autenticado)
- **Timezone:** `America/Sao_Paulo`
- **Idioma padrão:** `pt-br`
- **CELERY_BEAT_SCHEDULE:** `process_matchmaking` a cada 5 segundos
