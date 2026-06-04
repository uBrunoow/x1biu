---
name: map-docs-structure
description: Descobre todos os arquivos de documentação do projeto e mapeia o propósito de cada um. Use antes de qualquer operação de atualização de docs.
user-invocable: false
---

# Map Docs Structure

Descobre e mapeia toda a estrutura de documentação do projeto.

## 1. Encontrar Todos os Arquivos de Doc

```bash
# Docs em pasta dedicada
find docs/ -type f -name "*.md" 2>/dev/null | sort

# Docs na raiz
ls *.md 2>/dev/null

# Outros locais comuns
find . -maxdepth 3 -name "*.md" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.claude/*" \
  2>/dev/null | sort
```

## 2. Ler Cabeçalho de Cada Arquivo

Para cada arquivo encontrado, leia as primeiras linhas para entender o propósito:

```bash
for f in $(find docs/ *.md -maxdepth 1 -name "*.md" 2>/dev/null); do
  echo "=== $f ==="
  head -5 "$f" 2>/dev/null
  echo
done
```

## 3. Construir o Mapa

Monte o mapa de docs em contexto:

```
{
  "CLAUDE.md"              → "Contexto do projeto para IA — stack, estrutura, comandos",
  "README.md"              → "Visão geral, instalação, como rodar",
  "docs/api.md"            → "Endpoints REST documentados",
  "docs/models.md"         → "Modelos de dados e relacionamentos",
  "docs/guidelines.md"     → "Padrões de código e convenções",
  "docs/funcionalidades.md"→ "Features implementadas e planejadas",
  ...
}
```

## 4. Classificar por Categoria

Classifique cada doc encontrado em uma categoria para roteamento:

| Categoria | Palavras-chave no nome/conteúdo |
|-----------|--------------------------------|
| **API / Endpoints** | `api`, `endpoint`, `route`, `rest`, `url` |
| **Models / Schema** | `model`, `entidade`, `schema`, `db`, `dado` |
| **Funcionalidades** | `funcionalidade`, `feature`, `produto`, `sistema` |
| **Guidelines** | `guideline`, `padrao`, `convention`, `style`, `contributing` |
| **Infraestrutura** | `docker`, `deploy`, `ci`, `infra`, `setup` |
| **Frontend** | `frontend`, `component`, `design`, `ui`, `story` |
| **Geral** | README.md, CLAUDE.md |

## Saída esperada

O mapa completo de docs com categoria de cada arquivo, pronto para ser usado pela skill `route-docs-updates`.
