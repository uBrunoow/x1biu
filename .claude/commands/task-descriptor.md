---
description: Detalhamento funcional de tarefas - transforma tarefas brutas em especificações funcionais claras para validação de negócio
argument-hint: <task-ID>
allowed-tools: Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_view, mcp__backlog__document_list
---

# /task-descriptor $ARGUMENTS

## Posição no Pipeline

```
▶ /task-descriptor ◀ → /task-engineer → /task-executor → /task-code-review → /sync-docs → /create-commit-text
```

## Quando usar

Use como **primeiro passo** de qualquer task nova. Execute antes de qualquer análise técnica.

- Task deve estar em status **"To Do"**
- Foco em linguagem de negócio — **sem** detalhes técnicos
- O output deste comando é validado pelo usuário antes de prosseguir

## O que este comando produz

Ao final do detalhamento:
1. Descrição funcional completa salva na task
2. Critérios de aceitação **funcionais** (CA-F) definidos e aprovados
3. Escopo claramente delimitado (dentro/fora)
4. Task movida para **"Detailed"**

## Próximo passo

```
/task-engineer $ARGUMENTS   # Criar o plano técnico de implementação
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

Foco em: nome do projeto, stack, estrutura de diretórios.

---

## Passo 2 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceito: "To Do".
Status de trabalho: "In Detailing".

---

## Passo 2.5 — Exploração colaborativa (tasks ambíguas)

Se a task tiver **escopo ambíguo**, **múltiplas abordagens possíveis** ou decisões de produto não resolvidas:
Use a skill `brainstorming` para explorar a intent do usuário, propor abordagens e validar o design antes de escrever a spec.

A skill já salva um design doc e faz a transição natural para o próximo passo.

Se a task for clara e bem definida, pule este passo.

---

## Passo 3 — Gerar especificação funcional

Use a skill `generate-functional-spec`.

Restrições:
- Linguagem de negócio — sem detalhes técnicos
- Critérios de aceitação funcionais apenas (CA-F)
- Aprovação do usuário obrigatória antes de prosseguir

---

## Passo 4 — Finalizar

Use a skill `finalize-backlog-task` com status final "Detailed".
