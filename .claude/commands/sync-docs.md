---
description: Sincroniza documentação do projeto antes do commit - analisa arquivos staged e atualiza CLAUDE.md, README.md e docs/
argument-hint: "[task-ID] [--full] [--last-commit] [--dry-run]"
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(git diff:*), Bash(git add:*), Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__context7__resolve-library-id, mcp__context7__query-docs, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_list, mcp__backlog__document_view
---

# /sync-docs $ARGUMENTS

## Posição no Pipeline

```
/task-tests → ▶ /sync-docs ◀ → /create-commit-text → /create-pull-request
```

## Fluxo de uso recomendado

```bash
# Fluxo completo com task
/task-executor task-42      # Implementa
/task-code-review task-42   # Revisa
/sync-docs task-42          # Documenta → move task para "Done"
/create-commit-text         # Gera commit

# Fluxo sem task
git add <arquivos>
/sync-docs                  # Atualiza docs do staged
/create-commit-text
```

## Modos de execução

| Argumento | Comportamento |
|-----------|--------------|
| `task-ID` | Analisa staged + move task: "In Documenting" → "Done" |
| _(nenhum)_ | Analisa apenas arquivos em stage |
| `--full` | Sync completo de toda a base de docs |
| `--last-commit` | Analisa último commit (pós-commit) |
| `--dry-run` | Lista o que seria alterado sem modificar nada |

## O que este comando produz

1. Documentação atualizada: `CLAUDE.md`, `README.md`, `docs/`
2. Docs adicionados ao stage automaticamente
3. Se `task-ID` fornecido: task movida para **"Done"**

## Próximo passo

```
/create-commit-text   # Gerar mensagem de commit com tudo staged
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

---

## Passo 2 — Mapear estrutura de docs

Use a skill `map-docs-structure`.

Este mapa é essencial — guia todas as decisões de roteamento do próximo passo.

---

## Passo 3 — Carregar a task (se task-ID fornecido)

Se $ARGUMENTS contiver um task-ID, use a skill `load-backlog-task`.

Status de trabalho: "In Documenting".
Status final: "Done" (aplicado no Passo 4).

Se não houver task-ID, pule este passo.

---

## Passo 4 — Rotear e aplicar atualizações de docs

Use a skill `route-docs-updates`.

Modos conforme $ARGUMENTS:
- `--dry-run`: listar o que seria alterado, não modificar nada
- `--full`: analisar todo o histórico, não apenas staged
- `--last-commit`: analisar o último commit (pós-commit)
- _(nenhum)_: analisar apenas arquivos em stage (`git diff --staged`)

---

## Passo 5 — Finalizar (se task-ID fornecido)

Se houve task-ID no Passo 3, use a skill `finalize-backlog-task` com status final "Done".

Stage dos docs atualizados:
```bash
git add CLAUDE.md README.md docs/ 2>/dev/null
```
