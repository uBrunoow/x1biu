---
name: explore-task-conversation
description: Conduz conversa exploratória iterativa com o usuário para entender o problema, contexto e expectativas da task. Salva todo o histórico na task. Use no fluxo do task-explore.
user-invocable: false
---

# Explore Task Conversation

Conduz uma conversa aberta com o usuário para compreender o problema antes de qualquer solução. O objetivo é chegar ao "problema real" por trás da solicitação.

## 1. Ler o Contexto Existente

Leia a descrição atual da task — ela contém a mensagem inicial do usuário:

```
mcp__backlog__task_view(id: "<task-ID>")
```

Se houver notas anteriores de exploração, leia-as para não repetir perguntas já respondidas.

Em seguida, busque no vault Obsidian se já existe algo relacionado ao tema da task:

```bash
obsidian search query="<termo-chave da task>" limit=5
obsidian read file="funcionalidades"   # features já existentes
obsidian read file="glossario"         # termos de domínio do projeto
```

Fallback: `mcp__obsidian-docs__read_file(path="docs/funcionalidades.md")`

Use o que encontrar para:
- Identificar se a feature já existe (total ou parcialmente)
- Entender os termos de domínio corretos antes de fazer perguntas
- Direcionar perguntas para o que realmente é novo vs. extensão de algo existente

## 2. Preparar as Perguntas de Abertura

Com base na descrição inicial, identifique as lacunas de entendimento. Organize as perguntas nas categorias abaixo, priorizando as mais críticas:

### Categorias de perguntas exploratórias

**Contexto e motivação**
- Por que isso é necessário agora?
- Qual problema específico está gerando essa demanda?
- O que acontece se isso não for feito?

**Usuário afetado**
- Quem vai usar isso?
- Com que frequência?
- Qual é a dor atual do usuário?

**Escopo e limite**
- O que definitivamente está dentro do escopo?
- O que definitivamente está fora?
- Existe alguma funcionalidade similar já existente?

**Critério de sucesso**
- Como saberemos que está pronto?
- Qual é o resultado esperado do ponto de vista do usuário?
- Existe alguma restrição crítica (prazo, performance, compatibilidade)?

**Exemplos e referências**
- Existe algum sistema similar que serve de referência?
- Pode dar um exemplo concreto do fluxo desejado?

## 3. Conduzir a Conversa

### Rodada de perguntas

Selecione as 3-5 perguntas mais relevantes para o contexto atual e apresente-as:

```
AskUserQuestion(questions: [
  {
    question: "<pergunta principal — a mais crítica>",
    options: [] // deixar aberta para resposta livre
  },
  {
    question: "<segunda pergunta>",
    options: []
  },
  {
    question: "<terceira pergunta — opcional>",
    options: []
  }
])
```

**Regras para as perguntas:**
- Uma pergunta por vez (máximo 3 por rodada)
- Linguagem não técnica
- Perguntas abertas — evitar sim/não
- Não sugerir soluções nas perguntas

### Salvar respostas na task

Após cada rodada, salve imediatamente o histórico:

Usar quebras de linha REAIS — nunca escreva `\n` como texto (o Backlog MCP armazena literalmente):
```
mcp__backlog__task_edit(
  id: "<task-ID>",
  notesAppend: [
    "## Exploração — Rodada <N> — <data>

**P:** <pergunta>
**R:** <resposta do usuário>

**P:** <pergunta>
**R:** <resposta>"
  ]
)
```

### Avaliar se a exploração está completa

Após cada rodada, avalie:
- Entendo o problema real?
- Sei quem é afetado e como?
- O escopo está claro?
- Tenho o suficiente para escrever uma especificação funcional?

Se **não**, prepare nova rodada focando nas lacunas restantes.

Se **sim**, prossiga para o Passo 4.

**Máximo de rodadas:** 4. Se após 4 rodadas ainda houver ambiguidade, sinalize e prossiga com o que foi coletado.

## 4. Sintetizar o Entendimento

Após as rodadas de conversa, escreva um resumo do entendimento consolidado:

```markdown
## Problema entendido

**O problema:** <descrição do problema real em 1-2 frases>

**Quem é afetado:** <persona e contexto de uso>

**O que o usuário precisa:** <necessidade central, não a solução>

**Critério de sucesso:** <como saber que está resolvido>

**Escopo confirmado:**
- Dentro: <itens confirmados>
- Fora: <itens explicitamente excluídos>

**Pontos em aberto:** <dúvidas que não puderam ser respondidas agora>
```

## 5. Pedir Aprovação do Entendimento

```
AskUserQuestion(questions: [{
  question: "Este é o seu entendimento correto do problema?\n\n<resumo acima>",
  options: [
    { label: "Sim, está correto — avançar para requisitos" },
    { label: "Ajustar — preciso corrigir algo" },
    { label: "Recomeçar — entendimento errado" }
  ]
}])
```

Se "Ajustar", registrar a correção e atualizar o resumo.
Se "Recomeçar", limpar notas de exploração e iniciar do Passo 2.

## 6. Salvar Resumo Final na Task

Usar quebras de linha REAIS — nunca escreva `\n` como texto:
```
mcp__backlog__task_edit(
  id: "<task-ID>",
  description: "<descrição original>

---

## Exploração Concluída

<resumo consolidado>",
  notesAppend: [
    "## Exploração Aprovada — <data>

Entendimento validado pelo usuário."
  ]
)
```

## Saída esperada

Contexto completo do problema registrado na task, aprovado pelo usuário, pronto para a fase de requisitos.
