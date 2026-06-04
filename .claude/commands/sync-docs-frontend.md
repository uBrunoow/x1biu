---
description: Sincroniza documentação dos componentes frontend antes do commit - analisa arquivos staged e atualiza stories e docs de componentes
argument-hint: "[task-ID] [--full] [--dry-run] [--component <nome>]"
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(git diff:*), Bash(git add:*), Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_list, mcp__backlog__document_view
---

# /sync-docs-frontend $ARGUMENTS

## Quando usar

Use **em vez de** `/sync-docs` quando o commit envolver principalmente **componentes frontend**.
Para mudanças mistas (backend + frontend), rode os dois.

## Posição no Pipeline

```
/task-executor → /task-code-review → ▶ /sync-docs-frontend ◀ → /create-commit-text → git commit
```

## Fluxo recomendado

```bash
# Com task
/task-executor task-42
/task-code-review task-42
/sync-docs-frontend task-42   # Documenta componentes → move task para "Done"
/create-commit-text

# Para um componente específico
/sync-docs-frontend --component Button
```

## Modos de execução

| Argumento | Comportamento |
|-----------|--------------|
| `task-ID` | Analisa staged + move task: "In Documenting" → "Done" |
| _(nenhum)_ | Analisa componentes em stage |
| `--full` | Sync de todos os componentes do projeto |
| `--dry-run` | Lista o que seria atualizado sem modificar |
| `--component <nome>` | Sync de um componente específico pelo nome |

## O que este comando produz

1. **Stories atualizadas/criadas** — cobrindo todas as variantes e estados do componente
2. **history-books.md atualizado** — fonte de verdade para IA sobre o design system
3. Docs adicionados ao stage automaticamente
4. Se `task-ID` fornecido: task movida para **"Done"**

## Próximo passo

```
/create-commit-text   # Gerar mensagem de commit com tudo staged
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

Foco especial em: diretório frontend, ferramenta de docs (Storybook, Histoire, etc.) e localização do history-books.md.

---

## Passo 2 — Mapear estrutura de docs

Use a skill `map-docs-structure`.

Procure especialmente por: `history-books`, `design-system`, `storybook`, `stories`.

---

## Passo 3 — Carregar a task (se task-ID fornecido)

Se $ARGUMENTS contiver um task-ID, use a skill `load-backlog-task`.

Status de trabalho: "In Documenting".
Status final: "Done" (aplicado no Passo 4).

Se não houver task-ID, pule este passo.

---

## Passo 4 — Atualizar stories e docs de componentes

Use a skill `update-component-stories`.

Modos conforme $ARGUMENTS:
- `--component <nome>`: documentar apenas o componente especificado
- `--full`: documentar todos os componentes do projeto
- `--dry-run`: listar o que seria alterado sem modificar
- _(nenhum)_: documentar componentes com arquivos em stage

---

## Passo 5 — Finalizar (se task-ID fornecido)

Se houve task-ID no Passo 3, use a skill `finalize-backlog-task` com status final "Done".

Stage dos docs atualizados:
```bash
git add docs/frontend/ src/**/*.stories.* 2>/dev/null
```
