---
title: Fluxos
tags:
  - fluxos
  - negócio
aliases:
  - Fluxos de Negócio
---

# Fluxos

> Fluxos-chave de negocio e operacao.

Veja também: [[backend/fluxos]] · [[backend/entidades]] · [[backend/services]] · [[glossario]]

---

## Matchmaking

Um jogador entra na fila e é pareado com outro para iniciar uma partida.

```mermaid
sequenceDiagram
    participant A as Jogador A
    participant B as Jogador B
    participant API as Backend API
    participant WS as WebSocket
    participant Q as Celery

    A->>API: POST /queue/join/
    API-->>A: 200 OK (na fila)

    B->>API: POST /queue/join/
    API-->>B: 200 OK (na fila)

    Q->>Q: process_matchmaking (periódico)
    Q->>API: Cria Match + dois MatchParticipants
    Q->>WS: Notifica A e B → match_found {match_id}

    A->>WS: Conecta na sala da partida
    B->>WS: Conecta na sala da partida
```

---

## Batalha e Pontuação em Tempo Real

A partida começa quando ambos os jogadores estão conectados na sala WebSocket.

```mermaid
sequenceDiagram
    participant A as Jogador A (browser)
    participant WS as WebSocket Server
    participant S as ScoringService

    WS->>A: match_start {song_url, duration}
    WS->>A: (mesmo evento para Jogador B)

    note over A: Música toca no browser
    note over A: Microfone captura áudio

    loop a cada 50ms
        A->>WS: pitch_frame {hz: 440.0, frame: 42}
        WS->>S: score_frame(match_id, player_id, hz, frame)
        S-->>WS: score parcial atualizado
    end

    WS->>A: match_end {scores: {A: 8420, B: 7130}, winner: A}
```

---

## Resultado e Atualização de Ranking

Ao fim da partida, o servidor finaliza os registros e atualiza o ranking.

1. `MatchService.finalize(match)` determina o vencedor comparando `MatchParticipant.score` de cada jogador
2. Atualiza `Match.winner` e `Match.status = finished`
3. Atualiza `Player.wins` / `Player.losses` de cada jogador
4. O frontend exibe o resultado e redireciona para o ranking
