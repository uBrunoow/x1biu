---
title: Frontend Componentes
tags:
  - frontend
  - componentes
  - react
aliases:
  - Componentes
  - Components
---

# Frontend Componentes

> Catalogo de componentes.

Veja também: [[frontend/paginas]] · [[frontend/estado]] · [[frontend/history-book]] · [[frontend/manifesto]]

---

## ui/button

**Localização:** `src/components/ui/button.tsx`
**Origem:** Gerado pelo shadcn/ui
**Uso:** Botão base reutilizável em todo o projeto.

---

## AccuracyRing

**Localização:** `src/components/accuracy-ring.tsx`
**Uso:** Exibe a precisão do jogador como um anel SVG circular na tela de batalha.

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `pct` | `number` | sim | Percentual (0–100) de preenchimento do anel |
| `color` | `string` | sim | Cor do arco (ex: `var(--you)`) |
| `size` | `number` | não | Tamanho em px (padrão `92`) |

---

## PitchChart

**Localização:** `src/components/pitch-chart.tsx`
**Uso:** Gráfico SVG responsivo que exibe as curvas de pitch da referência e dos dois jogadores ao longo do tempo. Usado em [[frontend/paginas#/history/[id]|/history/[id]]].

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `pitchRef` | `PitchPoint[]` | sim | Pitch de referência da música |
| `myData` | `PitchPoint[]` | sim | Frames de pitch do jogador atual |
| `opponentData` | `PitchPoint[]` | sim | Frames de pitch do oponente |
| `myLabel` | `string` | sim | Label do jogador atual |
| `opponentLabel` | `string` | sim | Label do oponente |

`PitchPoint = { frame: number; hz: number }`

---

## PitchMeter

**Localização:** `src/components/pitch-meter.tsx`
**Uso:** Barra vertical que mostra o pitch atual do jogador comparado com o alvo de referência. Exibido durante a batalha em [[frontend/paginas#/match/[id]|/match/[id]]].

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `target` | `number` | sim | Posição normalizada (0–1) do pitch alvo |
| `value` | `number` | sim | Posição normalizada (0–1) do pitch detectado |
| `color` | `string` | sim | Cor da barra |
| `glow` | `string` | sim | Cor do glow quando acertando |
| `label` | `string` | sim | Nome exibido abaixo da barra |
| `score` | `number` | não | Pontuação exibida abaixo do label |
| `big` | `boolean` | não | Versão maior (320px vs 260px de altura) |

---

## PlayerChip

**Localização:** `src/components/player-chip.tsx`
**Uso:** Card com avatar inicial, nome e label "você"/"rival". Exibido durante a batalha.

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `name` | `string` | sim | Nickname do jogador |
| `color` | `string` | sim | Cor do avatar e borda |
| `you` | `boolean` | não | Exibe "você" no label (padrão: "rival") |

---

## TopBar

**Localização:** `src/components/top-bar.tsx`
**Uso:** Barra de navegação do app. Exibe o [[frontend/componentes#Wordmark|Wordmark]], tabs de navegação (início, ranking, histórico) e badge com o nickname do usuário autenticado. Renderizado pelo [[frontend/componentes#ShellClient|ShellClient]] nas páginas que não são de auth ou batalha.

Usa [[frontend/estado#useAuth|useAuth]] para ler o estado de autenticação.

---

## ShellClient

**Localização:** `src/components/shell-client.tsx`
**Uso:** Wrapper de layout que decide se exibe [[frontend/componentes#TopBar|TopBar]] e `UselessFooter`. Oculta o shell em `/login`, `/register` e na tela de batalha (`/match/{id}`).

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `children` | `React.ReactNode` | sim | Conteúdo da página |

---

## SoundMark

**Localização:** `src/components/sound-mark.tsx`
**Uso:** Ícone de barras de equalizador. Com `live=true`, anima as barras com keyframes CSS.

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `size` | `number` | não | Tamanho em px (padrão `34`) |
| `live` | `boolean` | não | Ativa animação de equalizador (padrão `false`) |
| `color` | `string` | não | Cor das barras (padrão `var(--you)`) |

---

## Wordmark

**Localização:** `src/components/wordmark.tsx`
**Uso:** Logo do app — [[frontend/componentes#SoundMark|SoundMark]] animado + texto "x1biu". Exibido no [[frontend/componentes#TopBar|TopBar]] e nas telas de auth.

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `size` | `number` | não | Tamanho da fonte em px (padrão `20`) |
| `sub` | `string` | não | Subtítulo abaixo do nome (ex: "batalha de assobios") |
