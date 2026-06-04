---
name: generate-functional-spec
description: Gera a especificação funcional de uma task - descrição em linguagem de negócio, fluxo do usuário, regras de negócio e critérios de aceitação funcionais (CA-F). Use no fluxo do task-descriptor.
user-invocable: false
---

# Generate Functional Spec

Gera a especificação funcional completa da task carregada em contexto. Foco em linguagem de negócio — sem detalhes técnicos.

## 1. Buscar Contexto de Negócio

Entenda o domínio antes de escrever. Use o Obsidian para encontrar contexto nos docs:

```bash
# Busca semântica no vault de docs
obsidian search query="<termos-chave da task>" limit=5

# Leia os docs relevantes encontrados
obsidian read file="funcionalidades"
obsidian read file="glossario"
obsidian read file="fluxos"
```

Fallback (se Obsidian não estiver aberto):
```
mcp__obsidian-docs__read_file(path="docs/funcionalidades.md")
mcp__obsidian-docs__read_file(path="docs/glossario.md")
```

Também busque tasks relacionadas no backlog:
```
mcp__backlog__task_search(query: "<termos-chave da task>")
mcp__backlog__task_list(status: "Done", limit: 10)
```

## 2. Gerar Descrição Funcional

Escreva em linguagem de negócio — acessível para não-técnicos:

```markdown
## Contexto
[Por que essa funcionalidade existe? Qual problema de negócio resolve?
Quem pediu? Qual o impacto esperado?]

## Descrição Funcional
[O que o sistema fará, do ponto de vista do usuário.
Comportamentos observáveis, não implementação.]

## Fluxo do Usuário
1. [O que o usuário faz]
2. [O que o sistema responde]
3. [Próximo passo]

## Regras de Negócio
- [Regra 1 — ex: "Apenas pedidos dos últimos 30 dias são exibidos"]
- [Regra 2]

## Escopo
### Dentro do Escopo
- [Item 1]
### Fora do Escopo
- [Item 1 — e por que está fora]

## Personas Afetadas
- **[Persona 1]:** [Como é afetada]
```

## 3. Gerar Critérios de Aceitação Funcionais

Critérios verificáveis por pessoa não técnica:

**Bons exemplos:**
- "Usuário visualiza lista com data, cliente e valor"
- "Sistema exibe total no card de resumo"
- "Filtro por período funciona corretamente"

**Evitar:**
- "Model criado com campos corretos" (técnico)
- "Endpoint retorna 200" (técnico)
- "Performance adequada" (vago)

## 4. Salvar e Pedir Aprovação

> **REGRA CRÍTICA DE FORMATAÇÃO:** O campo `description` é armazenado literalmente no arquivo `.md`. O Backlog MCP **não interpreta** sequências de escape. Isso significa:
> - Use quebras de linha REAIS — **NUNCA** escreva `\n` como texto
> - Use hierarquia de headings correta: `##` para seções, `###` para subseções
> - Escreva o conteúdo como markdown multi-linha real, não como string de uma linha

> **REGRA OBSIDIAN — WIKILINKS NA SPEC:** A descrição funcional é armazenada no arquivo `.md` da task dentro de `backlog/`. Use wikilinks quando mencionar entidades, fluxos ou funcionalidades do vault:
> - Entidades: `[[backend/entidades#NomeModel|NomeModel]]`
> - Fluxos: `[[fluxos#Nome do Fluxo]]` ou `[[backend/fluxos#Nome do Fluxo]]`
> - Funcionalidades existentes: `[[funcionalidades#Nome da Feature]]`
> - Termos do glossário: `[[glossario#Termo|Termo]]`
>
> **Nunca** coloque wikilinks dentro de blocos de código ou listas de CA-F.

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  description: "<descrição funcional completa — markdown multi-linha com quebras de linha reais>",
  acceptanceCriteriaSet: ["CA-F1: ...", "CA-F2: ...", "CA-F3: ..."]
)
```

> Use `acceptanceCriteriaSet` — o task-engineer adicionará CA-T depois com `acceptanceCriteriaAdd`.

```
AskUserQuestion(questions: [{
  question: "O detalhamento funcional está adequado?",
  options: [
    { label: "Aprovar — mover para 'Detailed'" },
    { label: "Ajustar" },
    { label: "Rejeitar — voltar para 'To Do'" }
  ]
}])
```
