---
title: Backend Services
tags:
  - backend
  - services
  - lógica-de-negócio
aliases:
  - Services
  - Lógica de Negócio
---

# Backend Services

> Serviços e lógica de negócio.

Veja também: [[backend/entidades]] · [[backend/crons]] · [[backend/fluxos]] · [[glossario]]

---

## MatchmakingService

**Arquivo:** `apps/matches/services.py`
**Responsabilidade:** Parear dois jogadores da [[backend/entidades#QueueEntry|fila]] e criar uma [[backend/entidades#Match|Match]].

| Método | Retorna | Descrição |
|--------|---------|-----------|
| `run()` | `Match \| None` | Busca os dois jogadores mais antigos na fila, sorteia uma [[backend/entidades#Song|Song]] ativa, cria a `Match` com dois [[backend/entidades#MatchParticipant|MatchParticipants]] e notifica ambos via WebSocket. Remove as `QueueEntry`s. Retorna `None` se há menos de 2 jogadores na fila. |

---

## ScoringService

**Arquivo:** `apps/matches/services.py`
**Responsabilidade:** Calcular a contribuição de um frame de pitch à pontuação do jogador.

**Inicialização:**
```python
ScoringService(song=song)
```

| Método | Parâmetros | Retorna | Descrição |
|--------|-----------|---------|-----------|
| `score_frame(player_hz, frame_index)` | `float`, `int` | `int` | Compara o pitch do jogador com a referência da música no frame. Retorna pontos (0–100) baseados na proximidade em cents. |

**Cálculo:** A frequência do jogador é normalizada para a mesma oitava da referência antes do cálculo. `cents = abs(1200 * log2(ratio))`. Pontuação cai linearmente de 100 (0 cents) a 0 (150+ cents); desvios acima de 150 cents valem 0.

---

## MatchService

**Arquivo:** `apps/matches/services.py`
**Responsabilidade:** Gerenciar o ciclo de vida de uma [[backend/entidades#Match|Match]].

| Método | Parâmetros | Descrição |
|--------|-----------|-----------|
| `start(match)` | `Match` | Marca `status=playing`, registra `started_at`, emite `match_start` via WebSocket com `song_url`, `pitch_ref` e lista de `players` |
| `finalize(match)` | `Match` | Compara pontuações dos participantes, determina vencedor, marca `status=finished`, atualiza `Player.wins`/`losses`, emite `match_end` |
| `forfeit(match, loser_id)` | `Match` | Declara derrota por desconexão — atribui `WIN`/`LOSS`, atualiza stats e emite `match_end` |
| `cancel(match)` | `Match` | Marca `status=cancelled` (sem participantes suficientes) |
