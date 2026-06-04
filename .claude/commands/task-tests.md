---
description: Executa a suíte de testes da task após code review - valida cobertura, resultados e critérios técnicos de teste
argument-hint: <task-ID> [--coverage] [--watch]
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__ide__executeCode, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_list
---

# /task-tests $ARGUMENTS

## Posição no Pipeline

```
/task-code-review → ▶ /task-tests ◀ → /sync-docs → /create-commit-text → /create-pull-request
```

## Quando usar

Execute **após** `/task-code-review` — o código foi revisado e aprovado.

- Task deve estar em status **"Reviewed"**
- Executa testes unitários, de integração e E2E conforme configuração do projeto
- Com `--coverage`, exige relatório de cobertura
- Com `--watch`, mantém os testes rodando (útil durante desenvolvimento)

## O que este comando produz

Ao final:
1. Resultados de todos os testes executados
2. Relatório de cobertura (se `--coverage`)
3. Lista de testes que falharam (se houver)
4. Task movida para **"Tested"** (sucesso) ou retorna para **"In Execution"** (falha crítica)

## Próximo passo

```
/sync-docs <task-ID>         # Atualizar documentação
/create-commit-text          # Gerar mensagem de commit
```

---

## Passo 1 — Carregar a task

Use a skill `load-backlog-task` com o task-ID de $ARGUMENTS.

Status aceito: "Reviewed".
Status de trabalho: "In Testing".

---

## Passo 2 — Executar testes

Use a skill `run-task-tests`.

Flags repassadas da $ARGUMENTS:
- `--coverage` → incluir relatório de cobertura
- `--watch` → modo watch (não finaliza automaticamente)

Se a task **não tiver testes escritos ainda** ou os testes existentes forem insuficientes, use a skill `test-driven-development` antes de executar — ela guia a escrita de testes em ciclos red-green-refactor.

---

## Passo 3 — Avaliar resultados

### Todos os testes passaram

Marcar CA-T relacionados a testes como verificados e prosseguir para o Passo 4.

### Falhas encontradas

Apresentar:

```
AskUserQuestion(questions: [{
  question: "<N> testes falharam. Como proceder?",
  options: [
    { label: "Corrigir e re-executar", description: "Voltar a task para 'In Execution'" },
    { label: "Aceitar com falhas conhecidas", description: "Registrar como débito técnico e prosseguir" },
    { label: "Pausar para investigação", description: "Manter em 'In Testing'" }
  ]
}])
```

Se "Corrigir e re-executar":
```
mcp__backlog__task_edit(id: "<task-ID>", status: "In Execution")
```
> Instruir o usuário a rodar `/task-executor <task-ID> --force` após corrigir.

---

## Passo 4 — Finalizar

Use a skill `finalize-backlog-task` com status final "Tested".

Ao finalizar, apresentar:

```markdown
## Testes concluídos ✓

**Task:** <task-ID> — <título>
**Status:** Tested
**Testes:** <passou>/<total>
**Cobertura:** <X>% (se disponível)

### Próximos passos
Execute em sequência:
1. `/sync-docs <task-ID>`
2. `/create-commit-text`
3. `/create-pull-request`
```
