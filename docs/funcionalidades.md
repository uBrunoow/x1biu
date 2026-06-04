---
title: Funcionalidades
tags:
  - produto
  - features
---

# Funcionalidades

> Catalogo de features previstas e implementadas.

Veja também: [[manifesto]] · [[backend/api]] · [[backend/entidades]] · [[fluxos]] · [[glossario]]

---

## Fila de Matchmaking

**Status:** ✅ Implementada
**Descrição:** O jogador entra na fila clicando em "Buscar Partida". O [[backend/services#MatchmakingService|MatchmakingService]] monitora a fila periodicamente via [[backend/crons#process_matchmaking|process_matchmaking]] e, quando há dois jogadores aguardando, cria uma [[backend/entidades#Match|Match]] e notifica ambos via WebSocket.

---

## Batalha em Tempo Real

**Status:** ✅ Implementada
**Descrição:** Ao entrar na partida, a música começa a tocar sincronizadamente para os dois jogadores via WebSocket. O microfone do browser captura o áudio do jogador. O pitch é extraído e enviado ao servidor em intervalos regulares para comparação com a [[backend/entidades#Song|Song]] de referência.

---

## Detecção e Pontuação de Pitch

**Status:** ✅ Implementada
**Descrição:** O [[backend/services#ScoringService|ScoringService]] compara o pitch captado pelo jogador (em Hz) com a frequência de referência da música no instante atual. A pontuação acumula ao longo da partida — quanto mais preciso e contínuo o assobio, maior a nota. Ver [[fluxos#Pontuação em Tempo Real]].

---

## Resultado e Vencedor

**Status:** ✅ Implementada
**Descrição:** Ao final da música, as pontuações de ambos os [[backend/entidades#MatchParticipant|MatchParticipants]] são comparadas. O jogador com maior pontuação vence. O resultado é exibido na tela e as stats do ranking são atualizadas.

---

## Ranking Global

**Status:** ✅ Implementada
**Descrição:** Cada partida concluída atualiza o ranking do jogador: vitórias, derrotas, winrate e pontuação média. A tabela de classificação é pública e acessível sem login.

---

## Catálogo de Músicas

**Status:** ✅ Implementada
**Descrição:** Músicas disponíveis para batalha ficam cadastradas no banco como [[backend/entidades#Song|Songs]], cada uma com título, artista, URL do áudio e dados de pitch de referência (array de frequências por frame). A seleção da música é aleatória a cada partida.

---

## Autenticação de Jogadores

**Status:** ✅ Implementada
**Descrição:** Login por e-mail e senha. O jogador escolhe um nickname exibido no ranking. Partidas só podem ser iniciadas por jogadores autenticados. Ver [[frontend/paginas#/login|/login]] e [[frontend/paginas#/register|/register]].

---

## Histórico de Partidas

**Status:** ✅ Implementada
**Descrição:** O jogador autenticado acessa o histórico completo de suas partidas em [[frontend/paginas#/history|/history]], com resultado, oponente, pontuações e data. O detalhe de cada partida finalizada exibe o gráfico de pitch comparativo via [[frontend/componentes#PitchChart|PitchChart]], consumindo o campo `pitch_data` armazenado em [[backend/entidades#MatchParticipant|MatchParticipant]].
