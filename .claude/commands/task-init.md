---
description: Cria uma nova task no Backlog.md a partir da solicitação do usuário e inicia o ciclo de exploração
argument-hint: "<título da task>"
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_create, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_list
---

# /task-init $ARGUMENTS

## Posição no Pipeline

```
▶ /task-init ◀ → /task-explore → /task-requirements → /task-engineer → /task-executor → /task-code-review → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

## Quando usar

Use como **ponto de entrada** para qualquer nova demanda. Recebe o título ou a primeira mensagem do usuário descrevendo o que ele quer.

- Cria a task no Backlog.md com status **"To Do"**
- Faz busca para evitar duplicatas antes de criar
- Passa automaticamente para `/task-explore` ao finalizar

## O que este comando produz

1. Task criada no Backlog.md com título e descrição inicial
2. Status inicial: **"To Do"**
3. Transição automática para exploração interativa

## Próximo passo automático

```
/task-explore <task-ID>   # Iniciar exploração interativa
```

---

## Passo 1 — Buscar duplicatas

Antes de criar, verifique se já existe task semelhante:

```
mcp__backlog__task_search(query: "<palavras-chave de $ARGUMENTS>")
mcp__backlog__task_list(status: "To Do")
mcp__backlog__task_list(status: "In Exploring")
```

Se encontrar task semelhante, perguntar ao usuário:

```
AskUserQuestion(questions: [{
  question: "Encontrei tasks semelhantes. O que prefere?",
  options: [
    { label: "Criar nova task mesmo assim" },
    { label: "Usar task existente <task-ID>", description: "Retomar de onde parou" },
    { label: "Cancelar" }
  ]
}])
```

---

## Passo 2 — Criar task no Backlog.md

```
mcp__backlog__task_create(
  title: "<título derivado de $ARGUMENTS>",
  description: "<primeira mensagem/descrição do usuário>",
  status: "To Do"
)
```

Registre o task-ID retornado — será usado em todos os passos seguintes.

---

## Passo 3 — Confirmar criação

Apresente ao usuário:

```markdown
## Task criada ✓

**ID:** <task-ID>
**Título:** <título>
**Status:** To Do

Iniciando exploração interativa...
```

---

## Passo 4 — Iniciar exploração

Execute imediatamente o comando `/task-explore <task-ID>`.
