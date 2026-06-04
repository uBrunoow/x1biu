---
name: generate-technical-plan
description: Gera o plano técnico de implementação - subtarefas de backend e frontend, mapa de paralelismo, critérios de aceitação técnicos (CA-T) e código de referência. Use no fluxo do task-engineer.
user-invocable: false
---

# Generate Technical Plan

Gera o plano técnico completo baseado na análise de código já feita em contexto.

## 0. Consultar Docs Relevantes no Vault

> Referência de comandos Obsidian: invoke `obsidian-cli`
> Referência de wikilinks e frontmatter: invoke `obsidian-markdown`

Antes de estruturar o plano, confirme o que já existe no vault para não reinventar padrões:

```bash
# Busca por entidades, endpoints ou fluxos relacionados à task
obsidian search query="<entidade ou feature da task>" limit=5

# Leia os docs das áreas impactadas
obsidian read file="entidades"      # para saber como models existentes estão estruturados
obsidian read file="api"            # para ver o padrão de endpoints existentes
obsidian read file="services"       # para ver o padrão de services
obsidian read file="crons"          # se envolve tasks Celery
```

Fallback (se Obsidian não estiver aberto):
```
mcp__obsidian-docs__read_file(path="docs/backend/entidades.md")
mcp__obsidian-docs__read_file(path="docs/backend/api.md")
mcp__obsidian-docs__read_file(path="docs/backend/services.md")
```

Use o que encontrar para:
- Nomear as subtarefas de forma consistente com o vocabulário do projeto
- Identificar models/services existentes que a task estende (não recriar)
- Referenciar com wikilinks no plano escrito

## 1. Estruturar Subtarefas

Divida a implementação em subtarefas atômicas:

```markdown
## Plano Técnico — task-ID

### Visão Geral de Subtarefas

| # | Subtarefa | Tipo | Depende | Paralelo com |
|---|-----------|------|---------|-------------|
| 1 | Criar Model X | Backend | — | — |
| 2 | Migration | Backend | 1 | — |
| 3 | Admin | Backend | 2 | 4, 5 |
| 4 | Serializer + API | Backend | 2 | 3, 5 |
| 5 | Types TypeScript | Frontend | 2 | 3, 4 |
| 6 | API Client | Frontend | 4 | — |
| 7 | Componente Y | Frontend | 5, 6 | — |

### SUBTAREFA 1: [Nome]
**Tipo:** Backend | Frontend | Teste
**Arquivos:** [lista]
**Depende de:** [—]

**Instruções:**
[Instruções detalhadas de implementação]

**Código de referência:**
```<linguagem>
[Exemplo de código]
```

**Checkpoint:**
```bash
[Comando de validação]
```
```

## 2. Mapa de Paralelismo

```
ST-1 ──┐
        ├──→ ST-2 ──→ ST-3 ──┐
ST-5 ──┘                      ├──→ ST-7
ST-4 ────────────────────────┘
```

## 3. Gerar Critérios de Aceitação TÉCNICOS

**REGRA CRÍTICA: sempre use `acceptanceCriteriaAdd`** — preserva os CA-F do task-descriptor.

Critérios técnicos verificáveis automaticamente:
- "Model X criado com campos Y, Z — `makemigrations --check` passa"
- "Endpoint `/api/x/` retorna 200 com schema correto"
- "Build frontend sem erros TypeScript"
- "Cobertura de testes ≥ 80%"

## 4. Salvar Plano e Pedir Aprovação

> **REGRA CRÍTICA DE FORMATAÇÃO:** Os campos `implementationPlan` e `implementationNotes` são armazenados literalmente no arquivo `.md`. O Backlog MCP **não interpreta** sequências de escape. Isso significa:
> - Use quebras de linha REAIS — **NUNCA** escreva `\n` como texto
> - Use hierarquia de headings correta: `##` para seções, `###` para subseções
> - Escreva o conteúdo como markdown multi-linha real, não como string de uma linha

> **REGRA OBSIDIAN — WIKILINKS NO PLANO:** O `implementationPlan` e `implementationNotes` ficam em arquivos `.md` no backlog. Use wikilinks ao mencionar entidades do projeto nas instruções narrativas (fora de blocos de código):
>
> | Ao mencionar | Usar |
> |---|---|
> | Um model existente | `[[backend/entidades#NomeModel\|NomeModel]]` |
> | Um service existente | `[[backend/services#NomeService\|NomeService]]` |
> | Uma task Celery | `[[backend/crons#nome_task\|nome_task]]` |
> | Um endpoint existente | `[[backend/api#NomeViewSet\|NomeViewSet]]` |
> | Um fluxo existente | `[[backend/fluxos#Nome do Fluxo]]` |
> | Um componente frontend | `[[frontend/componentes#NomeComponente\|NomeComponente]]` |
>
> **Nunca** coloque wikilinks dentro de blocos de código, comandos bash ou checkpoints.

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  implementationPlan: "<plano técnico completo — markdown multi-linha com quebras de linha reais>",
  acceptanceCriteriaAdd: ["CA-T1: ...", "CA-T2: ..."],
  implementationNotes: "<decisões técnicas — markdown multi-linha com quebras de linha reais>"
)
```

```
AskUserQuestion(questions: [{
  question: "O plano técnico está adequado?",
  options: [
    { label: "Aprovar — mover para 'Architected'" },
    { label: "Ajustar" },
    { label: "Rejeitar — repensar abordagem" }
  ]
}])
```
