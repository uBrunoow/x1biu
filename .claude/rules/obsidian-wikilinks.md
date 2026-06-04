# Obsidian Wikilinks — Regra Global

Toda documentação criada neste projeto (specs, planos, design docs, task descriptions) deve seguir o padrão **Obsidian Flavored Markdown** com wikilinks para entidades do vault em `docs/`.

## Vault de documentação

O vault Obsidian do projeto está em `docs/`. O índice está em `docs/index.md`.

## Regra: Wikilinks em Specs e Planos

Ao gerar qualquer documento em `docs/superpowers/specs/` ou `docs/superpowers/plans/`, use wikilinks quando mencionar entidades do projeto nas seções narrativas:

| Ao mencionar | Usar |
|---|---|
| Um model (IncomingEvent, OutgoingEvent, EventSource…) | `[[backend/entidades#NomeModel\|NomeModel]]` |
| Um service | `[[backend/services#NomeService\|NomeService]]` |
| Uma task Celery | `[[backend/crons#nome_task\|nome_task]]` |
| Um endpoint / ViewSet | `[[backend/api#NomeViewSet\|NomeViewSet]]` |
| Um fluxo técnico | `[[backend/fluxos#Nome do Fluxo]]` |
| Um fluxo de negócio | `[[fluxos#Nome do Fluxo]]` |
| Uma feature existente | `[[funcionalidades#Nome da Feature]]` |
| Um componente frontend | `[[frontend/componentes#NomeComponente\|NomeComponente]]` |
| Um termo do glossário | `[[glossario#Termo\|Termo]]` |

**Nunca** coloque wikilinks dentro de blocos de código, comandos bash, tabelas de File Map ou checkpoints.

## Frontmatter obrigatório

Todo documento novo em `docs/superpowers/` deve começar com:

```yaml
---
title: Nome Legível
tags:
  - spec       # para specs/design docs
  - plano      # para implementation plans
  - <domínio>  # ex: omie, bling, webhooks, frontend
---
```

## Antes de criar uma spec ou plano

Busque contexto no vault para não contradizer o que já existe:

```bash
obsidian search query="<tema>" limit=5
obsidian read file="funcionalidades"
obsidian read file="entidades"
obsidian read file="fluxos"
```

Fallback: `mcp__obsidian-docs__read_file(path="docs/funcionalidades.md")`
