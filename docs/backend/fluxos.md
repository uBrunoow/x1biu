---
title: Backend Fluxos
tags:
  - backend
  - fluxos
  - técnico
  - mermaid
aliases:
  - Fluxos Técnicos
  - Diagramas Backend
---

# Backend Fluxos

> Fluxos tecnicos do backend.

Veja também: [[fluxos]] · [[backend/entidades]] · [[backend/services]] · [[backend/crons]]

---

## Fluxo de Matchmaking

O Celery Beat roda `process_matchmaking` periodicamente e cria partidas quando há pelo menos 2 jogadores na fila.

```mermaid
sequenceDiagram
    participant Beat as Celery Beat
    participant Task as process_matchmaking
    participant DB as Database
    participant WS as WebSocket (Channels)

    Beat->>Task: dispara a cada 5s
    Task->>DB: QueueEntry.objects.order_by("joined_at")[:2]

    alt menos de 2 jogadores
        Task-->>Beat: retorna (noop)
    else 2+ jogadores disponíveis
        Task->>DB: Song aleatória (is_active=True)
        Task->>DB: Match.create(status=waiting, song=song)
        Task->>DB: MatchParticipant.create (×2)
        Task->>DB: QueueEntry.delete (×2)
        Task->>WS: group_send(player_A, match_found {match_id})
        Task->>WS: group_send(player_B, match_found {match_id})
    end
```

---

## Fluxo de Batalha (WebSocket)

Após receber `match_found`, ambos os jogadores conectam na sala da partida.

```mermaid
sequenceDiagram
    participant A as Jogador A (browser)
    participant B as Jogador B (browser)
    participant WS as MatchConsumer (Channels)
    participant Svc as MatchService / ScoringService
    participant DB as Database

    A->>WS: connect (ws://match/{id}/)
    B->>WS: connect (ws://match/{id}/)

    WS->>Svc: MatchService.start(match)
    Svc->>DB: Match.status = playing, started_at = now
    WS->>A: match_start {song_url, duration_ms}
    WS->>B: match_start {song_url, duration_ms}

    note over A,B: Música toca simultaneamente nos dois browsers

    loop a cada 50ms (enquanto músic toca)
        A->>WS: pitch_frame {hz: 440.0, frame: 42}
        WS->>Svc: ScoringService.score_frame(hz, frame)
        Svc-->>WS: pontos (0-100)
        WS->>DB: MatchParticipant.score += pontos
    end

    note over WS: música termina

    WS->>Svc: MatchService.finalize(match)
    Svc->>DB: determina winner, status = finished
    Svc->>DB: Player.wins / losses atualizados
    WS->>A: match_end {scores, winner}
    WS->>B: match_end {scores, winner}
```

---

## Estados da Match

| Status | Descrição |
|--------|-----------|
| `waiting` | Criada, aguardando os dois players conectarem via WebSocket |
| `playing` | Música tocando, frames de pitch sendo recebidos |
| `finished` | Música terminou, vencedor determinado |
| `cancelled` | Um jogador desconectou antes do fim |
