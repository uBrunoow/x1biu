---
description: Executa uma task do Backlog.md de forma completa - analisa, valida, implementa e verifica critérios de aceite
argument-hint: <task-ID> [--dry-run] [--force]
allowed-tools: Bash, Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__ide__executeCode, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list, mcp__backlog__task_search, mcp__backlog__document_view, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# /task-executor $ARGUMENTS

## Posição no Pipeline

```
/task-requirements → /task-engineer → ▶ /task-executor ◀ → /task-code-review → /task-tests → /sync-docs → /create-commit-text → /create-pull-request
```

## Engine de execução

| Complexidade | Engine | Quando usar |
|---|---|---|
| Simples | `execute-code-implementation` | ≤3 arquivos, mudança clara e linear |
| Complexa | `tlc-spec-driven` (Execute phase) | Múltiplos componentes, subtarefas paralelas, commits atômicos por subtarefa |
| Plano `writing-plans` (sequencial) | `executing-plans` | Plano com checkboxes gerado pelo `/task-engineer`, execução com checkpoints por batch |
| Plano `writing-plans` (paralelo) | `subagent-driven-development` | Plano com subtarefas independentes — subagente fresco por subtarefa com review entre cada uma |

## Pré-condições

Antes de executar, verifique:
- A task deve estar em status **"Architected"** (ideal), "To Do" ou "In Progress"
- Se houver `--dry-run`, apenas planeje — **não modifique código**
- Se houver `--force`, execute mesmo que a task já esteja "Done" ou "Executed"
- Tasks com dependencies não concluídas **não devem ser executadas** sem confirmação

## O que este comando produz

Ao final da execução bem-sucedida:
1. Código implementado e em stage (`git add`)
2. Task movida para **"Executed"** no Backlog
3. Todos os Acceptance Criteria verificados e marcados
4. Resumo com arquivos criados/modificados

## Próximos passos após execução

```
/task-code-review $ARGUMENTS   # Revisar o código implementado
/task-tests $ARGUMENTS         # Executar testes
/sync-docs $ARGUMENTS          # Atualizar documentação
/create-commit-text            # Gerar mensagem de commit
/create-pull-request           # Criar Pull Request
```

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

---

## Passo 2 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceitos: "Architected" (preferido), "To Do", "In Progress".
Status de trabalho: "In Execution".

Se `--force` estiver em $ARGUMENTS, execute mesmo que a task já esteja "Done" ou "Executed".

---

## Passo 3 — Analisar o código existente

Use a skill `analyze-code-for-task`.

Se `--dry-run` estiver em $ARGUMENTS, pule para o Passo 4 sem executar.

---

## Passo 4 — Implementar o código

Avalie a complexidade da task e escolha o engine de execução:

**Task simples** (≤3 arquivos, mudança clara):
Use a skill `execute-code-implementation`.

**Task complexa** (múltiplos componentes, subtarefas paralelas, decisões arquiteturais):
Use a skill `tlc-spec-driven` no modo **Execute** — ela gerencia sub-agentes, commits atômicos por subtarefa e verificação por checkpoint. Forneça o plano técnico da task como contexto inicial.

**Task com plano gerado por `writing-plans`** (sequencial com checkpoints):
Use a skill `executing-plans` — executa os checkboxes do plano em batch, pausa para review a cada checkpoint.

**Task com plano `writing-plans` e subtarefas independentes** (melhor paralelismo):
Use a skill `subagent-driven-development` — despacha subagente fresco por subtarefa, review entre cada uma.

**Task com subtarefas totalmente independentes que podem rodar simultaneamente**:
Use a skill `dispatching-parallel-agents` — coordena múltiplos subagentes em paralelo com merge dos resultados.

Se `--dry-run`, apresente apenas o plano e pare aqui — não modifique código.

---

## Passo 5 — Executar suíte de qualidade

Use a skill `run-quality-checks`.

Se houver falhas: registre como blocker e continue para validação de critérios.

---

## Passo 6 — Validar critérios de aceitação e verificar completude

Use a skill `validate-acceptance-criteria` para checar cada CA-F e CA-T da task.

Em seguida, use a skill `verification-before-completion` para garantir que nenhum detalhe foi esquecido antes de fechar a execução.

---

## Passo 7 — Finalizar

Use a skill `finalize-backlog-task` com status final "Executed".
