---
description: Endereça comentários de review em um Pull Request aberto no GitHub usando gh CLI
argument-hint: ""
allowed-tools: Bash(gh:*), Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git log:*), Glob, Grep, Read, Edit, Write, Task, AskUserQuestion
---

# /address-pr-comments

## Posição no Pipeline

```
git push → PR aberto → reviewer adiciona comentários → ▶ /address-pr-comments ◀ → /create-commit-text
```

## Pré-condições

- Branch atual deve ter um PR aberto no GitHub
- `gh` deve estar autenticado (`gh auth status`)
- Se não autenticado, rode: `! gh auth login`

## O que este comando produz

1. Lista numerada de todos os comentários/threads do PR com resumo do que cada um pede
2. Pergunta quais comentários você quer endereçar
3. Aplica as correções nos arquivos selecionados

## Próximos passos após endereçar

```bash
/create-commit-text   # Gerar commit com as correções
git push              # Atualizar o PR
```

---

## Passo 1 — Processar os comentários do reviewer

Use a skill `receiving-code-review` para ler e categorizar os comentários recebidos (quais são blockers, warnings, sugestões), entender a intenção do reviewer e priorizar o que endereçar.

---

## Passo 2 — Aplicar as correções

Use a skill `gh-address-comments` para aplicar as correções aprovadas no código.
