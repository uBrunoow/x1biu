---
title: Frontend Estado
tags:
  - frontend
  - hooks
  - estado
  - react-query
aliases:
  - Hooks
  - State Management
  - Contexts
---

# Frontend Estado

> Gerenciamento de estado.

Veja também: [[frontend/componentes]] · [[frontend/paginas]] · [[frontend/manifesto]] · [[backend/api]]

---

## useAuth

**Arquivo:** `src/hooks/useAuth.ts`
**Responsabilidade:** Lê o estado de autenticação do localStorage (token JWT) e expõe o usuário atual e o nickname.

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `user` | `{ user_id, email } \| null` | Dados do JWT decodificado |
| `nickname` | `string \| null` | Nickname do jogador ou fallback para o email |
| `loading` | `boolean` | `true` durante a leitura inicial |
| `signOut` | `() => Promise<void>` | Faz logout e redireciona para `/login` |

Usado por [[frontend/componentes#TopBar|TopBar]] e nas páginas que requerem autenticação.

---

## useMatchWebSocket

**Arquivo:** `src/hooks/useMatchWebSocket.ts`
**Responsabilidade:** Gerencia a conexão WebSocket com a sala da partida e expõe o estado reativo da batalha.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `matchId` | `string` | ID da partida (extraído da rota) |

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `status` | `"connecting" \| "waiting" \| "playing" \| "finished"` | Estado da partida |
| `songUrl` | `string \| null` | URL do áudio a ser reproduzido |
| `songTitle/Artist` | `string \| null` | Metadados da música |
| `durationMs` | `number \| null` | Duração da música em ms |
| `pitchRef` | `number[]` | Array de Hz de referência por frame |
| `rivalName` | `string \| null` | Nickname do oponente |
| `myScore` | `number` | Pontuação acumulada do jogador |
| `opponentScore` | `number` | Pontuação acumulada do oponente |
| `rivalHz` | `number` | Último pitch detectado do rival |
| `winnerId` | `string \| null` | ID do vencedor (após `match_end`) |
| `sendPitchFrame` | `(hz, frame) => void` | Envia frame de pitch ao servidor |
| `sendSongEnded` | `() => void` | Sinaliza fim da música |

Consumido pela página [[frontend/paginas#/match/[id]|/match/[id]]].

---

## usePitchDetection

**Arquivo:** `src/hooks/usePitchDetection.ts`
**Responsabilidade:** Acessa o microfone do browser e detecta a frequência fundamental do áudio em tempo real via autocorrelação (sem dependências externas). Faixa detectada: 500–4000 Hz (faixa de assobio humano).

| Retorno | Tipo | Descrição |
|---------|------|-----------|
| `hz` | `number \| null` | Frequência fundamental detectada ou `null` (silêncio/fora da faixa) |
| `isListening` | `boolean` | `true` quando o microfone está ativo |
| `start` | `() => Promise<void>` | Inicia captura de áudio (solicita permissão) |
| `stop` | `() => void` | Para captura e libera recursos |

Consumido pela página [[frontend/paginas#/match/[id]|/match/[id]]].

---

> O projeto usa **TanStack React Query** (instalado) para data fetching. Hooks de query serão documentados aqui conforme forem criados.
