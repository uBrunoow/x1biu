---
name: generate-commit-message
description: Gera uma mensagem de commit em Conventional Commits em português, derivando escopo e tipo das mudanças staged. Use no fluxo do create-commit-text.
user-invocable: false
---

# Generate Commit Message

Gera mensagem de commit profissional baseada nas mudanças staged.

## 1. Coletar Informações

```bash
git status --short
git diff --staged --stat
git diff --staged
git log --oneline -5
```

Se nada estiver staged, avisar:
> "Nenhum arquivo em stage. Execute `git add <arquivos>` primeiro."

## 2. Derivar Tipo e Escopo

**Tipo** — baseado na natureza das mudanças:

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `perf` | Melhoria de performance |
| `style` | Formatação, sem lógica |
| `test` | Testes |
| `docs` | Documentação |
| `chore` | Manutenção, deps, config |
| `build` | Build ou deps externas |
| `ci` | CI/CD |

**Escopo** — derive dos arquivos staged e do mapa de diretórios do projeto:
- Arquivo em `backend/apps/vendas/` → escopo `vendas`
- Arquivo em `frontend/src/components/Button` → escopo `button` ou `ui`
- Arquivo em `docs/` → escopo `docs`
- Arquivo em `.claude/` → escopo `claude`

Se recebeu escopo como argumento, use-o.

## 3. Gerar Mensagem

### Formato

```
<tipo>(<escopo>): <descrição imperativa curta — máx 50 chars>

<corpo opcional — O QUÊ e POR QUÊ, não COMO>
<máx 72 chars por linha>
```

### Regras obrigatórias

1. **Português brasileiro**
2. **Imperativo**: "adiciona", "corrige", "remove", "atualiza"
3. **Sem ponto final** na descrição curta
4. **Linha em branco** entre descrição e corpo
5. Corpo explica **motivação**, não o que o diff já mostra

### Para breaking changes

```
<tipo>(<escopo>)!: <descrição>

BREAKING CHANGE: <o que quebra>

Migração:
- <passos para migrar>
```

## 4. Apresentar Resultado

```
feat(vendas): adiciona filtro de devolucoes por periodo

Implementa filtro de data no endpoint /api/devolucoes/ e
no componente DevolucoesTable.

Motivação:
- Operadores precisavam visualizar apenas devolucoes do mes atual
- Reduz volume de dados carregados na tabela inicial
```

Comando git pronto:

```bash
git commit -m "$(cat <<'EOF'
<mensagem completa>
EOF
)"
```
