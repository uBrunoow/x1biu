---
description: Exploração interativa da task - conversa com o usuário para entender o problema, contexto e expectativas antes de detalhar requisitos
argument-hint: <task-ID>
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_view, mcp__backlog__document_list
---

# /task-explore $ARGUMENTS

## Posição no Pipeline

```
/task-init → ▶ /task-explore ◀ → /task-requirements → /task-engineer → /task-executor → /task-code-review → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

## Quando usar

Execute **após** `/task-init` ou diretamente em tasks com status "To Do".

- Foco em **entender o problema** — sem soluções técnicas ainda
- Conversa iterativa até o usuário confirmar que foi compreendido
- Todo o histórico da conversa é salvo na task

## O que este comando produz

Ao final da exploração:
1. Problema central compreendido e documentado
2. Contexto de negócio registrado na task
3. Perguntas abertas respondidas ou explicitamente abertas
4. Task movida para **"Explored"**

## Próximo passo

```
/task-requirements <task-ID>   # Detalhar requisitos com o PO
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

---

## Passo 2 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceito: "To Do".
Status de trabalho: "In Exploring".

---

## Passo 3 — Exploração iterativa

Avalie o escopo da task e escolha o modo de exploração:

**Task simples ou bem definida** (escopo claro, sem ambiguidades arquiteturais):
Use a skill `explore-task-conversation` — conversa focada no problema, registra histórico na task.

**Task complexa ou ambígua** (múltiplas abordagens, decisões de produto em aberto, feature nova):
Use a skill `brainstorming` — explora intent, propõe 2-3 abordagens com trade-offs, apresenta design para aprovação e salva design doc. A skill faz a transição natural para `writing-plans` ao final, que pode substituir o passo `/task-engineer` neste caso.

Em ambos os casos, registre o contexto relevante na task antes de finalizar.

---

## Passo 4 — Finalizar

Use a skill `finalize-backlog-task` com status final "Explored".

Ao finalizar, apresentar:

```markdown
## Exploração concluída ✓

**Task:** <task-ID> — <título>
**Status:** Explored

### Próximo passo
Execute: `/task-requirements <task-ID>`
```
