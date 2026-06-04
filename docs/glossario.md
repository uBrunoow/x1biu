---
title: Glossário
tags:
  - domínio
  - referência
aliases:
  - Termos
  - Domínio
---

# Glossario

> Termos de dominio e significados.

Veja também: [[backend/entidades]] · [[backend/services]] · [[backend/crons]] · [[fluxos]]

---

| Termo | Significado |
|-------|-------------|
| **Match** | Partida 1v1 entre dois jogadores. Contém a música sorteada, os dois participantes e o resultado. Ver [[backend/entidades#Match]]. |
| **MatchParticipant** | Registro da participação de um jogador em uma partida específica. Armazena a pontuação final e o resultado (vitória/derrota). Ver [[backend/entidades#MatchParticipant]]. |
| **QueueEntry** | Entrada de um jogador na fila de matchmaking. É deletada quando o jogador é pareado ou desiste. Ver [[backend/entidades#QueueEntry]]. |
| **Song** | Música cadastrada no sistema para uso nas batalhas. Contém o áudio e o array de pitch de referência por frame. Ver [[backend/entidades#Song]]. |
| **pitch** | Frequência fundamental de um som, medida em Hz. É o dado central comparado entre o assobio do jogador e a referência da música. |
| **pitch reference** | Array de frequências (em Hz) por frame de tempo, extraído da melodia da música. Serve como gabarito para a pontuação. |
| **frame** | Intervalo de tempo mínimo de comparação de pitch (ex: 50ms). A cada frame, o pitch do jogador é comparado com o frame equivalente da referência. |
| **score** | Pontuação acumulada de um jogador ao longo de uma partida. Calculada pelo [[backend/services#ScoringService|ScoringService]] com base na proximidade do pitch. |
| **matchmaking** | Processo de parear dois jogadores da fila para iniciar uma partida. Ver [[backend/services#MatchmakingService|MatchmakingService]] e [[fluxos#Matchmaking]]. |
| **WebSocket** | Protocolo de comunicação bidirecional usado para sincronizar o início da música e enviar eventos de pitch em tempo real durante a batalha. |
| **winrate** | Percentual de vitórias de um jogador em relação ao total de partidas disputadas. |
| **Celery** | Framework de processamento de tarefas assíncronas. Ver [[backend/crons]]. |
| **Redis** | Broker de mensagens e cache. Usado pelo Celery e pelo Django Channels para pub/sub de WebSocket. |
