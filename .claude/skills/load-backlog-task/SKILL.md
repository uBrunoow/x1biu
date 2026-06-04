---
name: load-backlog-task
description: Carrega uma task do Backlog.md, valida o status e move para o estado de trabalho correto. Use antes de qualquer operação que precise dos dados da task.
user-invocable: false
---

# Load Backlog Task

Carrega, valida e prepara uma task para trabalho. Recebe o task-ID do contexto atual.

## 1. Carregar Task

```
mcp__backlog__task_view(id: "<task-ID do contexto>")
```

Extraia e registre em contexto:
- **Título** e descrição funcional
- **Status atual**
- **Acceptance Criteria** funcionais (CA-F) e técnicos (CA-T)
- **Implementation Plan** (se existir — do task-engineer)
- **Implementation Notes** (observações técnicas)
- **Dependencies** (tasks bloqueantes)

## 2. Validar Status

Cada skill que usa `load-backlog-task` define os status aceitos. Regras gerais:

| Status | Comportamento |
|--------|--------------|
| Status esperado | Prosseguir normalmente |
| "Done" / "Executed" / "Reviewed" | Avisar e perguntar se quer forçar |
| Tem dependencies pendentes | Listar as blockers e interromper |

## 3. Verificar Dependencies

Se a task tiver dependencies:
```
mcp__backlog__task_list(status: "To Do")
mcp__backlog__task_list(status: "In Progress")
```

Se alguma dependency não estiver concluída, avisar:
> "Task bloqueada por: task-X (status: In Progress). Resolva primeiro ou prossiga consciente do risco."

## 4. Mover para Status de Trabalho

O status de destino varia por workflow:

| Workflow | Status de entrada | Status de trabalho |
|----------|------------------|-------------------|
| task-init | — | "To Do" (criação) |
| task-explore | "To Do" | "In Exploring" |
| task-requirements | "Explored" | "In Requirements" |
| task-descriptor | "To Do" | "In Detailing" |
| task-engineer | "Detailed" / "Requirements Defined" | "In Architecting" |
| task-executor | "Architected" / "To Do" | "In Execution" |
| task-code-review | "Executed" | "In Reviewing" |
| task-tests | "Reviewed" | "In Testing" |
| sync-docs | "Tested" / "Reviewed" | "In Documenting" |

```
mcp__backlog__task_edit(id: "<task-ID>", status: "<status de trabalho>")
```

## Saída esperada

Após esta skill, o contexto contém todos os dados da task e ela está no status correto para trabalho.
