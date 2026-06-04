---
description: Spec-driven development - planejamento e implementação com 4 fases adaptativas (Specify, Design, Tasks, Execute). Alternativa ao pipeline de backlog para projetos e features complexas.
argument-hint: "[feature-description] [--quick] [--map-codebase] [--init-project]"
allowed-tools: Bash, Glob, Grep, Read, Edit, Write, Task, AskUserQuestion, mcp__ide__getDiagnostics, mcp__ide__executeCode, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# /spec $ARGUMENTS

## Quando usar

Use em vez do pipeline `/task-descriptor → /task-engineer → /task-executor` quando:

- Iniciando um **projeto novo** do zero
- Trabalhando em um **codebase existente** sem mapeamento de arquitetura
- Feature com **ambiguidades ou decisões arquiteturais** não triviais
- Precisar de rastreabilidade de requisitos e commits atômicos

Para tasks simples e bem definidas no Backlog, prefira o pipeline padrão.

## Auto-sizing por complexidade

| Escopo | Profundidade |
|--------|-------------|
| **Pequeno** (≤3 arquivos) | Quick mode — sem pipeline |
| **Médio** (feature clara) | Specify + Execute |
| **Grande** (multi-componente) | Specify + Design + Tasks + Execute |
| **Complexo** (novo domínio) | Todas as fases + discussão de ambiguidades |

## Modos de execução

| Argumento | Comportamento |
|-----------|--------------|
| _(nenhum)_ | Spec de feature — detecta complexidade e aplica profundidade correta |
| `--quick` | Quick mode — para bug fixes, config changes, mudanças pequenas |
| `--map-codebase` | Mapeia codebase existente antes de iniciar (brownfield) |
| `--init-project` | Inicializa visão, goals e roadmap do projeto |

## Estrutura de arquivos gerada

```
.specs/
├── project/
│   ├── PROJECT.md      # Visão e objetivos
│   ├── ROADMAP.md      # Features e milestones
│   └── STATE.md        # Memória: decisões, blockers, ideias
├── codebase/           # Mapeamento brownfield
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   └── CONVENTIONS.md
└── features/
    └── [feature]/
        ├── spec.md     # Requisitos com IDs rastreáveis
        ├── design.md   # Arquitetura (Large/Complex)
        └── tasks.md    # Tarefas atômicas (Large/Complex)
```

## Pipeline

```
▶ /spec ◀ → implementação → git commit (atômico por task)
```

---

Use a skill `tlc-spec-driven` com os argumentos: $ARGUMENTS
