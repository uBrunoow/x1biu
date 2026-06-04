---
title: Backend Entidades
tags:
  - backend
  - models
  - banco-de-dados
aliases:
  - Models
  - Entidades
---

# Backend Entidades

> Models e relacionamentos.

Todos os models herdam de `BaseModel` (`config/utils/models.py`), que provê `id` (AutoField PK), `created_at` e `updated_at`.

Veja também: [[backend/api]] · [[backend/services]] · [[backend/crons]] · [[backend/fluxos]] · [[glossario]]

---

## User (Player)

> Jogador do sistema. Usa e-mail como login. O nickname é exibido no ranking.

**App:** `apps.management`
**Herda de:** `AbstractCUser` (django-username-email)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | EmailField | Login e identificador único |
| `nickname` | CharField | Nome exibido no ranking (único) |
| `wins` | PositiveIntegerField | Total de vitórias |
| `losses` | PositiveIntegerField | Total de derrotas |

**Propriedade:** `winrate` → `wins / (wins + losses)` se houver partidas, senão `0`

---

## Song

> Música disponível para uso nas batalhas. Contém o áudio e os dados de pitch de referência.

**App:** `apps.songs`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | CharField | Título da música |
| `artist` | CharField | Nome do artista |
| `audio_file` | FileField | Arquivo de áudio enviado via admin (upload para `songs/`) |
| `audio_url` | URLField | URL pública do áudio (preenchida após extração de pitch) |
| `duration_ms` | PositiveIntegerField | Duração em milissegundos |
| `pitch_reference` | JSONField | Array de `{frame, hz}` — frequência de referência por frame |
| `processing_status` | CharField | `pending` → `processing` → `ready` \| `error` |
| `is_active` | BooleanField | Quando `False`, não é sorteada para partidas |

---

## QueueEntry

> Entrada de um jogador na fila de matchmaking. Deletada quando o jogador é pareado ou sai da fila.

**App:** `apps.matches`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `player` | OneToOneField → User | Jogador na fila (um por vez) |
| `joined_at` | DateTimeField | Momento de entrada na fila |

---

## Match

> Partida 1v1 entre dois jogadores.

**App:** `apps.matches`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `song` | FK → Song | Música sorteada para a partida |
| `status` | CharField | `waiting` → `playing` → `finished` \| `cancelled` |
| `winner` | FK → User (nullable) | Vencedor; `null` em caso de empate ou cancelamento |
| `started_at` | DateTimeField | Início efetivo da batalha |
| `finished_at` | DateTimeField | Fim da batalha |

**Relacionamentos:** `participants` (MatchParticipant[], dois por partida)

---

## MatchParticipant

> Participação de um jogador em uma partida. Armazena a pontuação final.

**App:** `apps.matches`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `match` | FK → Match | Partida |
| `player` | FK → User | Jogador |
| `score` | PositiveIntegerField | Pontuação final acumulada |
| `result` | CharField | `win` \| `loss` \| `draw` \| `pending` |
| `pitch_data` | JSONField | Array de `{frame, hz}` detectados durante a batalha |

**Constraint:** `unique_together = [("match", "player")]`
