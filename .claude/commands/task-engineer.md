---
description: Arquiteto técnico de tarefas - cria plano de implementação completo com subtarefas, critérios técnicos e mapa de paralelismo
argument-hint: <task-ID>
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_view, mcp__backlog__document_list, mcp__context7__resolve-library-id, mcp__context7__query-docs, mcp__ide__getDiagnostics
---

# /task-engineer $ARGUMENTS

## Posição no Pipeline

```
/task-requirements → ▶ /task-engineer ◀ → /task-executor → /task-code-review → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

Pipeline legado compatível:
```
/task-descriptor → ▶ /task-engineer ◀ → ...
```

## Quando usar

Execute **após** `/task-requirements` (pipeline novo) ou `/task-descriptor` (pipeline legado).

- Task deve estar em status **"Requirements Defined"** ou **"Detailed"**
- Este comando analisa código existente antes de planejar
- Usa Context7 para consultar docs atualizadas das libs envolvidas
- O plano gerado é aprovado pelo usuário antes de prosseguir

## O que este comando produz

Ao final da arquitetura:
1. **Plano técnico** com subtarefas numeradas (Backend, Frontend, Testes)
2. **Mapa de paralelismo** — quais subtarefas podem rodar em paralelo
3. Critérios de aceitação **técnicos** (CA-T) adicionados aos funcionais existentes
4. Código de exemplo e checkpoints de validação por subtarefa
5. Task movida para **"Architected"**

## Engine de planejamento

| Complexidade | Engine | Quando usar |
|---|---|---|
| Simples | `generate-technical-plan` | Subtarefas lineares, sem decisões arquiteturais |
| Complexa | `tlc-spec-driven` (Design + Tasks phases) | Múltiplos componentes, decisões arquiteturais, subtarefas com dependências complexas |
| Complexa passo-a-passo | `writing-plans` | Plano com steps TDD granulares, código de exemplo por step e self-review de spec coverage |

## Importante

- **Nunca** use `acceptanceCriteriaSet` — isso apagaria os CA-F do task-descriptor
- **Sempre** use `acceptanceCriteriaAdd` para preservar os critérios funcionais

## Próximo passo

```
/task-executor $ARGUMENTS   # Implementar o plano técnico
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

---

## Passo 2 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceitos: "Requirements Defined" (pipeline novo) ou "Detailed" (pipeline legado).
Status de trabalho: "In Architecting".

Se status for "To Do" sem descrição funcional, avisar:
> "Task sem especificação funcional. Rode `/task-requirements <task-ID>` (ou `/task-descriptor <task-ID>`) primeiro."

---

## Passo 3 — Analisar o código existente

Use a skill `analyze-code-for-task`.

Foco em: models existentes, endpoints, componentes relacionados à task.

---

## Passo 3.5 — Análise arquitetural (opcional, para tasks complexas)

Se a task tocar em **múltiplos módulos ou fronteiras de serviço**, execute antes de planejar:

**Detectar acoplamento problemático:**
Use a skill `coupling-analysis` nos módulos identificados no Passo 3.
Objetivo: mapear coupling existente que o plano deve evitar piorar ou que pode precisar ser refatorado.

**Documentar decisões arquiteturais (se não houver `/design-doc` prévio):**
Use a skill `technical-design-doc-creator` para gerar um TDD da feature.
Objetivo: registrar decisões de arquitetura antes de gerar o plano técnico.

Se a task for simples e linear, pule este passo.

---

## Passo 4 — Gerar o plano técnico

Avalie a complexidade da task e escolha o engine de planejamento:

**Task simples** (subtarefas lineares, mudança clara):
Use a skill `generate-technical-plan`.

**Task complexa** (múltiplos componentes, decisões arquiteturais, dependências não triviais):
Use a skill `tlc-spec-driven` nas fases **Design** (opcional) e **Tasks** — ela gera subtarefas atômicas com IDs rastreáveis, critérios de verificação por subtarefa e mapa de paralelismo explícito.

**Task complexa com necessidade de plano passo-a-passo TDD** (quando o `/task-executor` vai usar `executing-plans` ou `subagent-driven-development`):
Use a skill `writing-plans` — ela gera steps granulares com código de exemplo por step, self-review de spec coverage e handoff explícito para execução. O plano é salvo em `docs/superpowers/plans/`.

Regra crítica em todos os casos: usar `acceptanceCriteriaAdd` (nunca `acceptanceCriteriaSet`) para preservar os CA-F.

---

## Passo 4.5 — Handoff de execução (planos `writing-plans`)

Se o Passo 4 usou `writing-plans`, ao final a skill oferece dois modos de execução:

- **`subagent-driven-development`** — subagente por subtarefa com review entre cada uma (recomendado para tasks com subtarefas independentes)
- **`executing-plans`** — execução inline com checkpoints por batch

Registre na task qual modo foi escolhido para guiar o `/task-executor`.

---

## Passo 5 — Finalizar

Use a skill `finalize-backlog-task` com status final "Architected".
