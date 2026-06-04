---
name: validate-acceptance-criteria
description: Valida todos os critérios de aceitação da task (CA-F e CA-T) após implementação. Gera relatório com evidências. Use após execute-code-implementation no fluxo do task-executor.
user-invocable: false
---

# Validate Acceptance Criteria

Valida TODOS os critérios de aceitação — funcionais (CA-F) e técnicos (CA-T).

## 1. Recarregar Critérios

```
mcp__backlog__task_view(id: "<task-ID>")
```

## 2. Verificar Cada Critério

Para cada critério, execute a verificação apropriada:

| Tipo de critério | Método de verificação |
|-----------------|----------------------|
| "Arquivo X existe" | `Glob("<padrão>")` |
| "Model criado/alterado" | `python manage.py makemigrations --check` |
| "Migration aplicada" | `python manage.py migrate` |
| "Backend sem erros" | make target de check ou `python manage.py check` |
| "Endpoint retorna X" | curl ou verificação via código |
| "Build frontend OK" | make build ou `pnpm build` no dir frontend |
| "TypeScript sem erros" | `npx tsc --noEmit` ou make typecheck |
| "Testes passando" | make test |
| "Sem erros no IDE" | `mcp__ide__getDiagnostics` |
| "Usuário visualiza X" | Verificar componente + API retorna dados |

> Adapte os comandos conforme stack e Makefile descobertos em `discover-project-context`.

## 3. Gerar Relatório de Critérios

```markdown
### Validação de Critérios de Aceitação

| # | Critério | Tipo | Status | Evidência |
|---|----------|------|--------|-----------|
| 1 | CA-F1: Usuário visualiza lista | Funcional | ✅ OK | Componente renderiza |
| 2 | CA-F2: Filtro funciona | Funcional | ✅ OK | Query param implementado |
| 3 | CA-T1: Model criado | Técnico | ✅ OK | makemigrations passa |
| 4 | CA-T2: Build sem erros | Técnico | ❌ FALHA | TypeError em X |

**Resultado: X/Y critérios atendidos**
```

## Saída esperada

- Lista de critérios atendidos (números para `acceptanceCriteriaCheck`)
- Lista de critérios NÃO atendidos com evidência do problema
- Resultado consolidado: PASS / FAIL
