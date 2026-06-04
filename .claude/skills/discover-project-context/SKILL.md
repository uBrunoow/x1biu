---
name: discover-project-context
description: Descobre e registra o contexto completo do projeto - stack, diretórios, targets do Makefile e mapa de docs. Sempre use esta skill antes de qualquer outra que precise conhecer o projeto.
user-invocable: false
---

# Discover Project Context

Descobre e registra mentalmente o contexto completo do projeto. Execute ANTES de qualquer outra skill.

## 1. Ler CLAUDE.md

```bash
cat CLAUDE.md 2>/dev/null || cat .claude/CLAUDE.md 2>/dev/null || echo "sem CLAUDE.md"
```

Se não encontrar, explore a raiz:
```bash
ls -la
```

## 2. Registrar Stack e Diretórios

Extraia e mantenha em contexto:

| Campo | O que procurar |
|-------|---------------|
| **Nome do projeto** | título no CLAUDE.md ou diretório raiz |
| **Diretório backend** | `backend/`, `api/`, `src/` com Python/Go/etc. |
| **Diretório frontend** | `frontend/`, `web/`, `client/` com JS/TS |
| **Framework backend** | Django, FastAPI, Express, Rails, etc. |
| **Framework frontend** | Next.js, React, Vue, etc. |
| **Package manager frontend** | pnpm, npm, yarn |
| **Banco de dados** | PostgreSQL, MySQL, SQLite, MongoDB |
| **Arquivo de guidelines** | `docs/guidelines.md`, `CONTRIBUTING.md`, etc. |

## 3. Descobrir Targets do Makefile

```bash
cat Makefile 2>/dev/null || echo "sem Makefile"
```

Se existir, extraia os targets disponíveis:
```bash
grep -E "^[a-zA-Z_-]+:" Makefile 2>/dev/null | grep -v "^#" | cut -d: -f1 | sort
```

Classifique os targets encontrados:
- **QA / tudo**: `qa`, `check`, `ci`, `all`, `verify`
- **Testes**: `test`, `tests`, `unit`, `integration`, `e2e`
- **Lint**: `lint`, `format`, `ruff`, `eslint`, `biome`
- **Type check**: `typecheck`, `types`, `mypy`, `tsc`
- **Build**: `build`, `compile`
- **Dev**: `run`, `dev`, `serve`, `start`

## 4. Mapear Estrutura de Docs via Obsidian

Se o projeto tem vault Obsidian em `docs/`, leia o índice primeiro:

```bash
obsidian read file="index" 2>/dev/null || true
```

Fallback (se Obsidian não estiver aberto):
```
mcp__obsidian-docs__read_file(path="docs/index.md")
```

Se não houver vault, mapeie por filesystem:
```bash
find docs/ -type f -name "*.md" 2>/dev/null | sort
```

Monte o mapa: `{ arquivo → propósito }` com base no `index.md` ou nos cabeçalhos encontrados.

## 5. Ler Guidelines via Obsidian

```bash
obsidian read file="guidelines" 2>/dev/null || true
```

Fallback:
```
mcp__obsidian-docs__read_file(path="docs/guidelines.md")
```

## Saída esperada

Ao final, você deve ter em contexto:
- Stack completa do projeto
- Caminhos exatos de backend e frontend
- Lista de targets do Makefile classificados
- Mapa de docs: quais arquivos existem e para que servem
- Padrões de código das guidelines
