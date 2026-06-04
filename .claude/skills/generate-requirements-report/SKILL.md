---
name: generate-requirements-report
description: Conversa com o PO para transformar a exploração em relatório de requisitos funcionais com regras de negócio e CA-F aprovados. Use no fluxo do task-requirements.
user-invocable: false
---

# Generate Requirements Report

Transforma o entendimento da exploração em especificação funcional formal. O PO valida cada seção antes de finalizar.

## 1. Ler Contexto da Exploração

```
mcp__backlog__task_view(id: "<task-ID>")
```

Extraia do histórico da task:
- Problema central identificado na exploração
- Personas afetadas
- Escopo confirmado (dentro/fora)
- Critério de sucesso inicial
- Pontos em aberto

Se a descrição não tiver registro de exploração, avisar:
> "Não encontrei registro de exploração nesta task. A especificação será menos precisa. Deseja continuar mesmo assim?"

## 2. Buscar Contexto de Negócio do Projeto

Use o Obsidian para encontrar funcionalidades e regras de negócio já documentadas:

```bash
# Busca semântica no vault de docs
obsidian search query="<termos-chave da task>" limit=5

# Leia os docs de negócio relevantes
obsidian read file="funcionalidades"
obsidian read file="glossario"
obsidian read file="fluxos"
obsidian read file="manifesto"
```

Fallback (se Obsidian não estiver aberto):
```
mcp__obsidian-docs__read_file(path="docs/funcionalidades.md")
mcp__obsidian-docs__read_file(path="docs/glossario.md")
```

Também busque no backlog:
```
mcp__backlog__task_search(query: "<termos-chave da task>")
mcp__backlog__task_list(status: "Done", limit: 10)
mcp__backlog__document_list()
```

Leia o que encontrar para entender regras de negócio já estabelecidas e evitar contradições com features existentes.

## 3. Conversa de Requisitos com o PO

Antes de gerar o relatório final, faça perguntas para refinar detalhes que a exploração não cobriu:

### Perguntas de refinamento de requisitos

**Sobre fluxos**
- Existe um fluxo alternativo (caminho infeliz) que precisa ser tratado?
- O que acontece quando o usuário cancela a operação no meio?
- Há validações específicas que o sistema precisa fazer?

**Sobre dados**
- Quais informações precisam ser exibidas ou coletadas?
- Existe hierarquia ou prioridade entre os dados?
- Há campos obrigatórios vs. opcionais?

**Sobre integrações**
- Esse fluxo depende de dados de outro sistema?
- Há notificações (e-mail, push, webhook) associadas?

**Sobre permissões**
- Todos os tipos de usuário têm acesso a essa funcionalidade?
- Existe algum controle de visibilidade ou permissão?

```
AskUserQuestion(questions: [
  { question: "<pergunta de refinamento mais crítica>", options: [] },
  { question: "<segunda pergunta>", options: [] }
])
```

Salvar respostas (com quebras de linha REAIS — nunca use `\n`):
```
mcp__backlog__task_edit(
  id: "<task-ID>",
  notesAppend: [
    "## Refinamento de Requisitos — <data>

<perguntas e respostas>"
  ]
)
```

## 4. Gerar Relatório de Requisitos

Escreva o relatório completo em linguagem de negócio:

```markdown
## Especificação Funcional — <título da task>

### Contexto
<Por que essa funcionalidade existe? Qual problema de negócio resolve? Quem pediu? Qual o impacto esperado?>

### Descrição Funcional
<O que o sistema fará, do ponto de vista do usuário. Comportamentos observáveis, não implementação.>

### Fluxo Principal
1. <O que o usuário faz>
2. <O que o sistema responde>
3. <Próximo passo>
...

### Fluxos Alternativos
**FA01 — <nome do fluxo alternativo>**
1. <Condição de entrada no fluxo alternativo>
2. <O que o sistema faz>
3. <Resultado>

### Regras de Negócio
- **RN01:** <Regra 1 — ex: "Apenas pedidos dos últimos 30 dias são exibidos">
- **RN02:** <Regra 2>
- **RN03:** <Regra 3>

### Escopo
**Dentro do Escopo**
- <Item confirmado 1>
- <Item confirmado 2>

**Fora do Escopo**
- <Item excluído 1> — <motivo>
- <Item excluído 2> — <motivo>

### Personas Afetadas
- **<Persona 1>:** <Como é afetada, frequência de uso>
- **<Persona 2>:** <Como é afetada>

### Restrições e Dependências
- <Restrição técnica ou de negócio, se houver>
- <Dependências de outros sistemas ou features>
```

## 5. Gerar Critérios de Aceitação Funcionais (CA-F)

Critérios verificáveis por pessoa não técnica. Cada um deve ser testável manualmente:

**Formato:** "Dado <contexto>, quando <ação>, então <resultado esperado>"

**Bons exemplos:**
- "Dado que sou um usuário autenticado, quando acesso a lista de pedidos, então vejo apenas meus pedidos dos últimos 30 dias"
- "Dado que preencho o formulário sem o campo obrigatório 'nome', quando clico em salvar, então o sistema exibe mensagem de erro específica"
- "Dado que aprovo um pedido, quando o sistema processa, então o status muda para 'Aprovado' e o cliente recebe notificação"

**Evitar:**
- "Model criado com campos corretos" (técnico)
- "Endpoint retorna 200" (técnico)
- "Performance adequada" (vago)
- "Sistema funciona corretamente" (não verificável)

Gere entre 5 e 10 CA-F que cubram: fluxo principal, fluxos alternativos, regras de negócio críticas e tratamento de erros.

## 6. Apresentar e Pedir Aprovação

Apresente o relatório completo e os CA-F ao PO:

```
AskUserQuestion(questions: [{
  question: "O relatório de requisitos está completo e correto?\n\n<resumo dos CA-F gerados>\n\nCA-F total: <N>",
  options: [
    { label: "Aprovar — mover para 'Requirements'" },
    { label: "Ajustar o relatório", description: "Corrigir ou adicionar informações" },
    { label: "Ajustar os CA-F", description: "Adicionar, remover ou reescrever critérios" },
    { label: "Recomeçar", description: "Relatório não reflete o que foi discutido" }
  ]
}])
```

Se "Ajustar", incorporar as correções e apresentar novamente.

## 7. Salvar na Task

Após aprovação:

```
mcp__backlog__task_edit(
  id: "<task-ID>",
  description: "<relatório completo gerado no Passo 4>",
  acceptanceCriteriaSet: [
    "CA-F01: <critério 1>",
    "CA-F02: <critério 2>",
    ...
  ]
)
```

> Use `acceptanceCriteriaSet` — os CA-T serão adicionados depois pelo task-engineer com `acceptanceCriteriaAdd`.

## Saída esperada

Relatório de requisitos aprovado pelo PO salvo na task, com CA-F definidos e prontos para a fase de arquitetura técnica.
