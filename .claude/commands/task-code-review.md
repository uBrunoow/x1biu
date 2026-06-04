---
description: Code review automatizado - analisa arquivos staged cobrindo qualidade, segurança e performance
argument-hint: "[task-ID] [--staged] [--full]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# /task-code-review $ARGUMENTS

## Posição no Pipeline

```
/task-executor → ▶ /task-code-review ◀ → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

## O que é revisado

| Categoria | Verificações |
|-----------|-------------|
| **Qualidade** | DRY, nomenclatura, complexidade, dead code, padrões do projeto |
| **Segurança** | SQL injection, XSS, CSRF, exposição de dados, validação de input |
| **Performance Backend** | N+1 queries, select_related, índices, bulk operations |
| **Performance Frontend** | Re-renders, bundle size, lazy loading, memoização |
| **Build/Types** | TypeScript sem erros, build passando, lint limpo |

## Modos de execução

| Argumento | Comportamento |
|-----------|--------------|
| `task-ID` | Review dos staged + valida Acceptance Criteria da task |
| `--staged` | Review apenas dos arquivos em stage |
| `--full` | Review do diff completo da branch contra main |

## Severidades

- **Blocker** — segurança, bug crítico, build quebrado → **deve** corrigir
- **Warning** — performance, inconsistência → recomendado corrigir
- **Suggestion** — melhorias opcionais

## O que este comando produz

1. Relatório classificado por severidade
2. Correções aplicadas automaticamente (com aprovação para cada uma)
3. Task movida para **"Reviewed"** (ou volta para "In Execution" se tiver blockers)
4. Critérios de aceitação re-validados

## Próximo passo

```
/task-tests $ARGUMENTS   # Executar testes após o review
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

Importante: este passo já descobre os targets do Makefile para os checks de qualidade.

---

## Passo 2 — Carregar a task (se task-ID fornecido)

Se $ARGUMENTS contiver um task-ID, use a skill `load-backlog-task`.

Status aceito: "Executed".
Status de trabalho: "In Reviewing".

Se não houver task-ID, pule este passo.

---

## Passo 3 — Executar suíte de qualidade

Use a skill `run-quality-checks`.

Registre os resultados — eles entram no relatório do próximo passo.

---

## Passo 4 — Revisar o código

Use a skill `review-code-changes`.

Se a task foi carregada no Passo 2, use os Acceptance Criteria como checklist adicional.

Se encontrar **bugs ou comportamento inesperado** durante o review que precisem de investigação antes de corrigir, use a skill `systematic-debugging` — ela garante diagnóstico correto antes de propor qualquer fix.

Se quiser solicitar review de outro agente ou registrar os findings para um reviewer humano, use a skill `requesting-code-review`.

---

## Passo 4.5 — Análise de acoplamento (opcional)

Se a implementação **tocou em fronteiras entre módulos** ou introduziu novas dependências entre serviços, use a skill `coupling-analysis` nos módulos modificados.

Objetivo: detectar regressões de acoplamento introduzidas pela implementação (ex: model coupling onde deveria ser contract, functional coupling não intencional).

Se detectado problema de acoplamento, registre como **Warning** ou **Blocker** no relatório do Passo 4.

Se a task foi simples e contida em um único módulo, pule este passo.

---

## Passo 5 — Finalizar

Use a skill `finalize-backlog-task`.

- **Se sem blockers**: status final "Reviewed"
- **Se com blockers não corrigidos**: status final "In Execution"
