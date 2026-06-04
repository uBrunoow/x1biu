<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_workflow_overview()` tool to load the tool-oriented overview (it lists the matching guide tools).

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

---

# x1biu — Batalha de Assobios

## Visão Geral

App de batalha 1v1 de assobios. Dois jogadores entram na fila, são pareados, uma música toca simultaneamente para ambos e cada um assobia acompanhando a melodia. O pitch captado pelo microfone é comparado com a referência da música em tempo real — quem assobiar com maior precisão ganha a partida e sobe no ranking.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django + DRF + Uvicorn |
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui |
| Banco de dados | postgresql |
| Fila | Celery + Redis |
| Infra | Docker Compose |
| API Docs | drf-spectacular (scalar) |

## Estrutura

```
x1biu/
├── backend/          # Django
├── frontend/         # Next.js
├── docker/           # Docker Compose
├── backlog/          # Backlog.md
├── docs/             # Documentação
├── .env.example
├── Makefile
└── CLAUDE.md
```

## Comandos rápidos

```bash
make install     # Instala todas as dependências
make rundb       # Sobe Docker em background
make backend     # Inicia servidor Django
make frontend    # Inicia servidor Next.js
make qa          # Roda testes + build
make lint        # Roda linters
```
