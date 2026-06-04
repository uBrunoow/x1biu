---
name: finalize-backlog-task
description: Finaliza uma task do Backlog - marca critérios, adiciona notas, faz stage dos arquivos e move para o status final. Use como último passo de qualquer workflow de task.
user-invocable: false
---

# Finalize Backlog Task

Último passo de qualquer workflow. Consolida o trabalho feito e fecha a task.

## 1. Determinar Status Final

O status final depende do workflow que chamou esta skill:

| Workflow | Status final |
|----------|-------------|
| task-explore | "Explored" |
| task-requirements | "Requirements Defined" |
| task-descriptor | "Detailed" |
| task-engineer | "Architected" |
| task-executor | "Executed" |
| task-code-review | "Reviewed" ou "In Execution" (se blockers) |
| task-tests | "Tested" ou "In Execution" (se falhas críticas) |
| sync-docs / sync-docs-frontend | "Done" |

## 2. Se TODOS os critérios atendidos

### 2a. Marcar critérios como verificados

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  acceptanceCriteriaCheck: [1, 2, 3, ...]
)
```

### 2b. Adicionar notas de execução

> **REGRA CRÍTICA DE FORMATAÇÃO:** O campo `notesAppend` é armazenado literalmente no arquivo `.md`. O Backlog MCP **não interpreta** sequências de escape. Isso significa:
> - Use quebras de linha REAIS — **NUNCA** escreva `\n` como texto
> - Use `###` para subseções (não `#` ou `##`)
> - Escreva o conteúdo como markdown multi-linha real

O conteúdo deve ter esta estrutura (com quebras de linha reais entre cada bloco):

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  notesAppend: [
    "## <Workflow> Concluído — <data>

### Entregues
- <item1>
- <item2>

### Arquivos
- Modificados: <lista>
- Criados: <lista>"
  ]
)
```

### 2c. Stage dos arquivos modificados

```bash
git add <arquivos criados e modificados>
```

Para docs:
```bash
git add CLAUDE.md README.md docs/ 2>/dev/null
```

### 2d. Mover para status final

```
mcp__backlog__task_edit(id: "<task-ID>", status: "<status final>")
```

### 2e. Apresentar resumo

```markdown
## Task <task-ID> — <Status Final> ✓

### Critérios: X/X atendidos
### Arquivos: <lista>

### Próximos passos
<próximos comandos sugeridos>
```

## 3. Se NEM TODOS os critérios atendidos

- **Não mover** para status final — manter no status de trabalho
- Marcar apenas os critérios atendidos
- Apresentar os critérios pendentes claramente
- Perguntar como proceder:

```
AskUserQuestion(questions: [{
  question: "Critérios não atendidos: #X, #Y. Como proceder?",
  options: [
    { label: "Continuar tentando", description: "Resolver os critérios pendentes" },
    { label: "Aceitar entrega parcial", description: "Mover para status final mesmo assim" },
    { label: "Pausar para revisão manual", description: "Manter no status atual" }
  ]
}])
```
