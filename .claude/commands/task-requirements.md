---
description: Conversa de requisitos com o PO - transforma a exploração em especificação funcional detalhada com regras de negócio e critérios de aceitação
argument-hint: <task-ID>
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_view, mcp__backlog__document_list
---

# /task-requirements $ARGUMENTS

## Posição no Pipeline

```
/task-explore → ▶ /task-requirements ◀ → /task-engineer → /task-executor → /task-code-review → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

## Quando usar

Execute **após** `/task-explore` — a task deve ter o contexto da exploração registrado.

- Task deve estar em status **"Explored"**
- Foco em linguagem de negócio — **sem** detalhes técnicos
- O relatório de requisitos é validado pelo PO antes de prosseguir

## O que este comando produz

Ao final:
1. Relatório de requisitos funcionais completo (RF)
2. Regras de negócio documentadas (RN)
3. Critérios de aceitação funcionais (CA-F) aprovados pelo PO
4. Escopo explícito: dentro/fora
5. Task movida para **"Requirements Defined"**

## Próximo passo

```
/task-engineer <task-ID>   # Criar plano técnico de implementação
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

Foco em: nome do projeto, domínio de negócio, funcionalidades já existentes relacionadas.

---

## Passo 2 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceito: "Explored".
Status de trabalho: "In Requirements".

Se status for "To Do" sem exploração, avisar:
> "Task sem exploração prévia. Rode `/task-explore <task-ID>` primeiro para entender o problema."

---

## Passo 3 — Gerar relatório de requisitos

Use a skill `generate-requirements-report`.

A skill conduz a conversa com o PO e gera o relatório completo.

---

## Passo 4 — Finalizar

Use a skill `finalize-backlog-task` com status final "Requirements Defined".

Ao finalizar, apresentar:

```markdown
## Requisitos definidos ✓

**Task:** <task-ID> — <título>
**Status:** Requirements
**CA-F definidos:** X critérios

### Próximo passo
Execute: `/task-engineer <task-ID>`
```
