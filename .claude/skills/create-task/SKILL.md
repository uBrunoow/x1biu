---
name: create-task
description: Cria uma task no Backlog.md a partir do título e da mensagem inicial do usuário, com busca de duplicatas. Use no fluxo do task-init.
user-invocable: false
---

# Create Task

Cria a task no Backlog.md evitando duplicatas e retorna o task-ID para uso nos passos seguintes.

## 1. Buscar Duplicatas

Antes de criar, verifique se já existe task com conteúdo semelhante:

```
mcp__backlog__task_search(query: "<termos-chave do título>")
```

Em seguida, liste tasks abertas para comparação visual:

```
mcp__backlog__task_list(status: "To Do")
mcp__backlog__task_list(status: "In Exploring")
mcp__backlog__task_list(status: "Explored")
mcp__backlog__task_list(status: "In Requirements")
mcp__backlog__task_list(status: "Requirements Defined")
```

Se encontrar task com mais de 60% de similaridade no título ou descrição, perguntar:

```
AskUserQuestion(questions: [{
  question: "Encontrei tasks semelhantes:\n<lista de tasks encontradas>\n\nO que prefere?",
  options: [
    { label: "Criar nova task mesmo assim" },
    { label: "Retomar task existente", description: "Usar o task-ID encontrado" },
    { label: "Cancelar" }
  ]
}])
```

Se "Retomar task existente", retornar o task-ID existente sem criar nova task.

## 2. Criar a Task

```
mcp__backlog__task_create(
  title: "<título limpo e objetivo>",
  description: "<primeira mensagem do usuário — contexto inicial>",
  status: "To Do"
)
```

**Regras para o título:**
- Máximo 80 caracteres
- Imperativo: "Criar X", "Implementar Y", "Corrigir Z"
- Sem prefixos técnicos (TASK-001, feat:, etc.)

**Regras para a descrição inicial:**
- Preservar a intenção original do usuário sem interpretar
- Não adicionar soluções técnicas
- Registrar como "Contexto inicial fornecido pelo usuário:"

## 3. Registrar task-ID em contexto

Após criar, registre o task-ID retornado no contexto da conversa. Ele será necessário em todos os passos seguintes.

## Saída esperada

```markdown
**Task criada:**
- ID: <task-ID>
- Título: <título>
- Status: To Do
```
