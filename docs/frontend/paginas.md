---
title: Frontend Páginas
tags:
  - frontend
  - páginas
  - rotas
aliases:
  - Rotas
  - Pages
---

# Frontend Paginas

> Mapa de rotas e paginas.

Veja também: [[frontend/componentes]] · [[frontend/estado]] · [[backend/api]] · [[frontend/manifesto]]

---

## /

**Arquivo:** `src/app/page.tsx`
**Tipo:** Server Component
**Descrição:** Página inicial / lobby. Exibe o botão "Buscar Partida" e acesso ao ranking. Jogadores autenticados podem entrar na fila diretamente.

---

## /login

**Arquivo:** `src/app/(auth)/login/page.tsx`
**Tipo:** Client Component
**Descrição:** Formulário de login com e-mail e senha. Usa `login()` de `@/lib/auth`. Redireciona para `/` em caso de sucesso. Exibe toast de erro em credenciais inválidas.

---

## /register

**Arquivo:** `src/app/(auth)/register/page.tsx`
**Tipo:** Client Component
**Descrição:** Formulário de cadastro de novo jogador. Cria conta via `POST /api/auth/register/` (endpoint de management). Redireciona para `/login` após cadastro.

---

## /queue

**Arquivo:** `src/app/queue/page.tsx`
**Tipo:** Client Component
**Descrição:** Tela de espera na fila. Exibe animação de busca e cancela a entrada via `DELETE /queue/leave/`. Redireciona para `/match/{id}` assim que o WebSocket emite `match_found`.

---

## /match/[id]

**Arquivo:** `src/app/match/[id]/page.tsx`
**Tipo:** Client Component
**Descrição:** Tela de batalha em tempo real. Toca a música, acessa o microfone do browser via [[frontend/estado#usePitchDetection|usePitchDetection]], detecta o pitch e envia frames via [[frontend/estado#useMatchWebSocket|useMatchWebSocket]]. Exibe pontuação parcial de ambos os jogadores com [[frontend/componentes#PitchMeter|PitchMeter]] e [[frontend/componentes#AccuracyRing|AccuracyRing]]. Ao receber `match_end`, redireciona para `/match/{id}/result`.

---

## /match/[id]/result

**Arquivo:** `src/app/match/[id]/result/page.tsx`
**Tipo:** Client Component
**Descrição:** Tela de resultado da partida. Exibe pontuações finais, vencedor e botão para voltar ao lobby ou entrar na fila novamente.

---

## /ranking

**Arquivo:** `src/app/ranking/page.tsx`
**Tipo:** Server Component
**Descrição:** Tabela pública de classificação. Exibe nickname, vitórias, derrotas e winrate de todos os jogadores. Não requer autenticação. Consome [[backend/api#RankingView|RankingView]].

---

## /history

**Arquivo:** `src/app/history/page.tsx`
**Tipo:** Client Component (requer auth)
**Descrição:** Lista paginada do histórico de partidas do jogador autenticado. Exibe resultado (vitória/derrota/empate), música, oponente, pontuações e data. Redireciona para `/login` se não autenticado. Consome `GET /matches/` com paginação de 10 itens/página.

---

## /history/[id]

**Arquivo:** `src/app/history/[id]/page.tsx`
**Tipo:** Client Component (requer auth)
**Descrição:** Detalhe de uma partida finalizada. Exibe placar final e o gráfico de pitch via [[frontend/componentes#PitchChart|PitchChart]] com curvas do jogador, do oponente e da referência da música. Consome `GET /matches/{id}/`. Só acessível para partidas com `status=finished`.
