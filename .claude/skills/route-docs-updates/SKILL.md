---
name: route-docs-updates
description: Roteia as mudanças de código para os arquivos de documentação corretos, lê cada arquivo antes de editar e aplica mudanças no formato existente. Use após map-docs-structure no fluxo do sync-docs.
user-invocable: false
---

# Route Docs Updates

Roteia cada categoria de mudança para o arquivo de doc correto usando o mapa descoberto em `map-docs-structure`.

## 1. Identificar Mudanças a Documentar

Use as alterações identificadas no contexto (staged ou diff):

```bash
git diff --staged --name-only
git diff --staged --stat
```

Para cada arquivo alterado, classifique a mudança:

| Arquivo alterado | Categoria |
|-----------------|-----------|
| `models.py`, `schema.py` | Models/Schema |
| `views.py`, `urls.py`, `routes.py` | API/Endpoints |
| `*.tsx`, `*.jsx` em `app/` | Funcionalidades frontend |
| `settings.py`, `.env.example`, `docker-compose*`, `Makefile` | Configuração/Infra |
| `.claude/commands/`, `.claude/skills/` | Slash Commands |
| `signals.py`, `services.py` | Serviços/Sinais |
| `tests/`, `*_test.py`, `*.test.ts` | Testes |

## 2. Para Cada Categoria — Encontrar e Atualizar o Doc Correto

### Regra de Roteamento

Use o mapa de docs em contexto. Para cada categoria:

```
Categoria Models  → procurar doc com "model|entidade|schema|db" no nome
Categoria API     → procurar doc com "api|endpoint|route|rest" no nome
Categoria Feature → procurar doc com "funcionalidade|feature|sistema" no nome
Categoria Infra   → README.md (seção de instalação/execução) e CLAUDE.md
Categoria Comandos→ README.md e/ou CLAUDE.md
```

**Se não encontrou doc específico** → documenta em README.md ou CLAUDE.md.

### Leitura Obrigatória Antes de Editar

```
Read("<arquivo de doc alvo>")
```

Identifique:
- Formato do conteúdo (tabelas, listas, seções)
- Onde a nova informação deve ser inserida
- Padrão existente para replicar

### Aplicar Mudança no Formato Existente

```
Edit("<arquivo de doc alvo>", ...)
```

Princípios:
- **Cirúrgico**: edite apenas a seção relevante, não reescreva o arquivo
- **Consistente**: use o mesmo formato/padrão das entradas existentes
- Se o arquivo usa tabelas → adicione como nova linha
- Se usa listas → adicione como novo item
- Se usa seções H2/H3 → adicione na seção correta

## 3. Casos Específicos

### Novo Model/Entidade
Adicione com: nome, campos, tipos, relacionamentos, exemplo de uso.

### Novo Endpoint/API
Adicione com: método HTTP, URL, parâmetros, resposta exemplo, códigos de erro.

### Nova Funcionalidade
Marque como implementada se estava como planejada, ou adicione nova entrada.

### Novo Comando Make/Slash
Adicione na seção de comandos com: nome, descrição, exemplo.

### Mudança de Configuração
Atualize variáveis de ambiente, pré-requisitos ou instruções de setup.

## Saída esperada

Lista dos arquivos de doc modificados e o que foi alterado em cada um.
