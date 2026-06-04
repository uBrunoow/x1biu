---
description: Gera mensagem de commit e executa o commit automaticamente
argument-hint: "escopo-opcional"
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git commit:*), Read, Grep
---

# /create-commit-text $ARGUMENTS

## Posição no Pipeline

```
/task-executor → /task-code-review → /sync-docs → ▶ /create-commit-text ◀ → /create-pull-request
```

## Pré-condição obrigatória

**Os arquivos devem estar em stage antes de executar este comando.**

Se nada estiver em stage, avise o usuário e interrompa.

## Argumento opcional

Se `$ARGUMENTS` contiver um escopo (ex: `api`, `dashboard`, `auth`), use-o como escopo do commit.
Caso contrário, derive o escopo a partir dos arquivos staged e do `CLAUDE.md` do projeto.

## O que este comando produz

1. Mensagem de commit em **Conventional Commits** (em português)
2. Tipo derivado das mudanças (`feat`, `fix`, `refactor`, `docs`, `chore`, etc.)
3. Corpo explicando motivação quando relevante
4. **Commit executado automaticamente** — sem copiar e colar

---

## Passo 1 — Descobrir contexto do projeto

Use a skill `discover-project-context`.

Foco em: nome do projeto, estrutura de diretórios (para derivar escopos).

---

## Passo 2 — Gerar mensagem de commit

Use a skill `generate-commit-message`.

Se $ARGUMENTS contiver um escopo, passe-o para a skill usar como escopo do commit.
Caso contrário, a skill deriva o escopo dos arquivos staged.

---

## Passo 3 — Executar o commit

Com a mensagem gerada no Passo 2, execute o commit diretamente:

```bash
git commit -m "$(cat <<'EOF'
<tipo>(<escopo>): <assunto>

<corpo — motivação e contexto>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Após o commit, confirme o resultado:

```bash
git log --oneline -3
```

Apresente ao usuário:

```markdown
## Commit criado ✓

**Hash:** <hash curto>
**Mensagem:** <linha de assunto>

### Próximo passo
Execute: `/create-pull-request`
```
