---
name: execute-code-implementation
description: Executa a implementação do código baseado no plano técnico da task. Segue subtarefas, respeita paralelismo e valida cada checkpoint. Use no fluxo do task-executor.
user-invocable: false
---

# Execute Code Implementation

Implementa o código da task seguindo o plano técnico carregado em contexto.

## 1. Preparar Plano de Execução

**Se a task tem Implementation Plan (do task-engineer):**
- Listar subtarefas na ordem definida
- Identificar quais podem rodar em paralelo

**Se NÃO tem Implementation Plan:**
- Criar plano baseado nos Acceptance Criteria
- Dividir em passos lógicos

Para `--dry-run`: apresentar o plano e parar aqui.

```markdown
## Plano de Execução — task-ID

### Subtarefas
1. [ST-1] — independente
2. [ST-2] — depende de ST-1
3. [ST-3] — paralela com ST-4

### Arquivos
- Criar: [lista]
- Modificar: [lista]
```

## 2. Executar Cada Subtarefa

Para cada subtarefa do plano:

### 2a. Entender o código e padrões existentes

Antes de escrever código, confirme os padrões do projeto no vault:

```bash
# Busca o padrão que a subtarefa implementa (model, endpoint, service, etc.)
obsidian search query="<tipo da subtarefa>" limit=3
```

Para subtarefas específicas:
- Criando model → `obsidian read file="entidades"` (ver como outros models são estruturados)
- Criando endpoint → `obsidian read file="api"` (ver padrão de ViewSets)
- Criando service → `obsidian read file="services"` (ver padrão de Services)
- Criando task Celery → `obsidian read file="crons"` (ver padrão de tasks)

Fallback: `mcp__obsidian-docs__read_file(path="docs/backend/<area>.md")`

Depois leia os arquivos de código diretamente impactados:
```
Read("<arquivo alvo>")
Grep("<padrão relevante>")
```

### 2b. Implementar

| Operação | Ferramenta |
|----------|------------|
| Criar arquivo novo | `Write` |
| Editar arquivo existente | `Edit` |
| Buscar padrões | `Grep` |

### 2c. Verificar checkpoint

Execute o checkpoint definido na subtarefa:
```bash
<comando de validação da subtarefa>
```

Verifique erros no IDE:
```
mcp__ide__getDiagnostics
```

## 3. Paralelismo

Se o plano indica subtarefas independentes, use `Task` para executá-las em paralelo:

```
Task(prompt="Implementar subtarefa ST-3: [instruções completas]...")
Task(prompt="Implementar subtarefa ST-4: [instruções completas]...")
```

## 4. Tratamento de Erros

Se encontrar erro (máx. 3 tentativas automáticas):

```
AskUserQuestion(questions: [{
  question: "Erro: [ERRO]. Como proceder?",
  options: [
    { label: "Tentar abordagem alternativa" },
    { label: "Pular este passo" },
    { label: "Pausar para revisão manual" }
  ]
}])
```

## Saída esperada

Código implementado, todos os checkpoints passando, arquivos prontos para stage.
