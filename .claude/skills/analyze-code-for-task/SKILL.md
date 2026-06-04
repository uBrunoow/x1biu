---
name: analyze-code-for-task
description: Analisa o código existente relevante para a task atual - encontra arquivos impactados, padrões existentes e consulta docs das libs. Use após load-backlog-task quando precisar entender o código antes de implementar ou planejar.
user-invocable: false
---

# Analyze Code For Task

Analisa o código existente com base na task carregada em contexto.

## 0. Buscar Documentação no Vault Obsidian

Antes de tocar no código, busque contexto nos docs do projeto. Isso evita retrabalho e garante consistência com o que já existe.

> Referência completa de comandos: invoke `obsidian-cli`
> Para buscas avançadas por tag ou propriedade: invoke `obsidian-bases`

```bash
# Busca semântica no vault — retorna notas relevantes para a task
obsidian search query="<termo-chave da task>" limit=5
```

Se o Obsidian não estiver aberto, use o MCP de filesystem como fallback:
```
mcp__obsidian-docs__search_files(pattern="*.md", path="docs/")
```

Leia os docs relevantes nesta ordem de prioridade:

| Se a task envolve… | Ler primeiro |
|---|---|
| Criar/alterar models | `obsidian read file="entidades"` |
| Criar/alterar endpoints | `obsidian read file="api"` |
| Criar/alterar services | `obsidian read file="services"` |
| Tasks Celery / filas | `obsidian read file="crons"` |
| Alterar um fluxo existente | `obsidian read file="fluxos"` |
| Componentes / páginas frontend | `obsidian read file="componentes"` ou `obsidian read file="paginas"` |
| Termos de domínio novos | `obsidian read file="glossario"` |
| Verificar se feature já existe | `obsidian read file="funcionalidades"` |

Registre em contexto: quais entidades, endpoints e fluxos **já existem** e são relevantes para esta task. Isso alimenta o plano técnico e a spec funcional.

## 1. Identificar Arquivos Relevantes

Com base na descrição da task e no plano técnico (se existir), encontre os arquivos impactados:

**Backend:**
```bash
# Models
Grep("class.*Model|class.*Schema", path="{backend_dir}", glob="*.py")

# Views / Controllers
Grep("def.*view|@api_view|ViewSet|@router|@app.route", path="{backend_dir}", glob="*.py")

# URLs / Rotas
Glob("{backend_dir}/**/urls.py")
Glob("{backend_dir}/**/routes.py")
```

**Frontend:**
```bash
Glob("{frontend_dir}/src/app/**/*.{tsx,ts}")
Glob("{frontend_dir}/src/components/**/*.tsx")
Glob("{frontend_dir}/src/lib/**/*.ts")
```

## 2. Ler Arquivos Chave

Para cada arquivo diretamente impactado pela task, leia seu conteúdo:
```
Read("<arquivo relevante>")
```

Foco em entender:
- Padrões existentes (como outros models/endpoints/componentes estão estruturados)
- Nomes de variáveis, classes e funções relacionadas
- Imports já utilizados
- Onde o novo código deve ser inserido

## 3. Verificar Tasks Concluídas Relacionadas

```
mcp__backlog__task_search(query: "<termos-chave da task atual>")
```

Entenda implementações anteriores que impactam esta task.

## 4. Consultar Docs das Libs (Context7)

Se a task envolve APIs específicas de libs:

```
mcp__context7__resolve-library-id(libraryName: "<framework>")
mcp__context7__query-docs(libraryId: "<id>", query: "<questão específica>")
```

Use Context7 principalmente para:
- APIs que você não tem certeza da assinatura
- Mudanças de versão recentes
- Padrões específicos do framework

## Saída esperada

Após esta skill, o contexto contém:
- Lista de arquivos que serão criados ou modificados
- Padrões existentes a seguir
- Qualquer gotcha ou constraint identificado no código atual
