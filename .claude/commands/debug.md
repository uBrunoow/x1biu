---
description: Diagnóstico sistemático de bugs e comportamentos inesperados - investiga a causa raiz antes de propor qualquer fix
argument-hint: "[descrição do problema ou task-ID]"
allowed-tools: Bash, Glob, Grep, Read, Edit, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__ide__executeCode, mcp__backlog__task_view
---

# /debug $ARGUMENTS

## Quando usar

Use **sempre que encontrar um bug, falha de teste ou comportamento inesperado** antes de tentar qualquer correção.

- Falhas de teste que não fazem sentido imediato
- Bug reportado pelo usuário ou pelo code review
- Comportamento diferente entre ambientes
- Erro intermitente ou difícil de reproduzir

> **Nunca proponha um fix sem diagnóstico.** O objetivo aqui é entender **por quê** antes de decidir **o quê** mudar.

## O que este comando produz

1. Hipóteses de causa raiz priorizadas por probabilidade
2. Evidências coletadas para confirmar ou descartar cada hipótese
3. Causa raiz confirmada e documentada
4. Plano de correção mínimo e seguro

## Próximo passo

```
/task-executor <task-ID>   # Implementar a correção planejada
/create-commit-text        # Commit do fix
```

---

Use a skill `systematic-debugging` com os argumentos: $ARGUMENTS
