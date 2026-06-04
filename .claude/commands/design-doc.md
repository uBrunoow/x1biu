---
description: Cria Technical Design Documents (TDD) completos com seções interativas - use antes de implementar features complexas ou decisões arquiteturais
argument-hint: "[feature ou sistema a documentar]"
allowed-tools: Bash, Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# /design-doc $ARGUMENTS

## Posição no Pipeline

```
/task-descriptor → ▶ /design-doc ◀ → /task-engineer → /task-executor
```

## Quando usar

Use **entre** `/task-descriptor` e `/task-engineer` quando a feature envolve:
- Decisões arquiteturais que precisam de alinhamento do time
- Integração com sistemas externos (APIs, pagamentos, autenticação)
- Migração ou substituição de sistemas existentes
- Features com impacto em segurança ou compliance

Para tasks simples, vá direto para `/task-engineer`.

## O que este comando produz

Um TDD com as seções relevantes para a feature:

| Seção | Descrição |
|-------|-----------|
| **Contexto** | Por que isso precisa ser construído |
| **Definição do Problema** | Qual problema está sendo resolvido |
| **Solução Técnica** | Arquitetura, componentes, fluxo de dados |
| **Contratos de API** | Schemas de request/response |
| **Estrutura de Dados** | Modelos, tabelas, tipos |
| **Riscos** | Pontos de atenção e mitigações |
| **Plano de Rollback** | Como reverter se necessário |
| **Estratégia de Testes** | Abordagem de validação |

> O TDD documenta **decisões arquiteturais e contratos**, não código de implementação.

## Padrões seguidos

- **Google Design Docs** — Context, Goals, Non-Goals, Design, Alternatives
- **ADR** — Architecture Decision Records
- **RFC Pattern** — Summary, Motivation, Explanation, Alternatives
- **SRE Book** — Monitoring, Rollback, SLOs

## Próximo passo

```
/task-engineer $ARGUMENTS   # Gerar plano técnico baseado no TDD
```

---

Use a skill `technical-design-doc-creator` com os argumentos: $ARGUMENTS
