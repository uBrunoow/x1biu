---
description: Cria Pull Request no GitHub com título, descrição e checklist gerados a partir da task e das mudanças staged
argument-hint: [<task-ID>] [--draft] [--base <branch>]
allowed-tools: Bash, Glob, Grep, Read, Task, AskUserQuestion, mcp__backlog__task_view, mcp__backlog__task_list
---

# /create-pull-request $ARGUMENTS

## Posição no Pipeline

```
/task-tests → /sync-docs → /create-commit-text → ▶ /create-pull-request ◀
```

## Quando usar

Execute como **último passo** do pipeline — após commit criado.

- Requer `gh` CLI autenticado
- Usa dados da task (se task-ID fornecido) para enriquecer a descrição

> Se não tiver certeza se o trabalho está realmente completo antes de abrir o PR (testes passando, docs atualizadas, sem TODOs pendentes), use primeiro a skill `finishing-a-development-branch` — ela guia a decisão de integração e apresenta as opções (merge direto, PR, squash, etc.) antes de prosseguir.
- Com `--draft`, cria como rascunho
- Com `--base <branch>`, usa o branch especificado como base (padrão: main/master)

## O que este comando produz

1. Pull Request criado no GitHub
2. Título derivado do commit ou da task
3. Descrição com: resumo, mudanças, task relacionada, checklist de review
4. Link do PR apresentado ao usuário
5. Task movida para **"Done"** (se task-ID fornecido)

---

## Passo 1 — Coletar contexto

```bash
git log --oneline -5
git diff --stat HEAD~1..HEAD
git branch --show-current
```

Se task-ID em $ARGUMENTS:
```
mcp__backlog__task_view(id: "<task-ID>")
```

Extraia: título, descrição funcional, CA-F e CA-T para compor a descrição do PR.

---

## Passo 2 — Verificar pré-condições

```bash
gh auth status
git status
```

Se houver arquivos não commitados, avisar:
> "Há mudanças não commitadas. Rode `/create-commit-text` primeiro."

---

## Passo 3 — Determinar branch base

Se `--base <branch>` em $ARGUMENTS, usar esse branch.

Caso contrário, detectar automaticamente:
```bash
git remote show origin | grep 'HEAD branch'
```

---

## Passo 4 — Gerar e criar o PR

Monte o corpo do PR com este template:

```markdown
## Resumo
<descrição funcional da task ou resumo das mudanças>

## Mudanças
<lista dos arquivos modificados com descrição breve>

## Task relacionada
- Backlog: <task-ID> — <título>

## Critérios de aceitação
<CA-F e CA-T da task formatados como checklist>

## Checklist de review
- [ ] Código revisado
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Sem secrets expostos

---
🤖 Gerado com [Claude Code](https://claude.com/claude-code)
```

```bash
gh pr create \
  --title "<título>" \
  --body "$(cat <<'EOF'
<corpo gerado acima>
EOF
)" \
  [--draft se --draft em $ARGUMENTS] \
  --base <branch base>
```

---

## Passo 5 — Finalizar task (se task-ID fornecido)

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  status: "Done",
  notesAppend: ["## Pull Request criado — <data>\n\nPR: <url do PR>"]
)
```

---

## Passo 6 — Apresentar resultado

```markdown
## Pull Request criado ✓

**PR:** <url>
**Branch:** <branch> → <base>
**Task:** <task-ID> — Done ✓

O PR está pronto para revisão.
```
