---
title: Frontend Manifesto
tags:
  - frontend
  - stack
  - next.js
aliases:
  - Stack Frontend
---

# Frontend Manifesto

> Stack, bibliotecas e estrutura do frontend Next.js.

Veja também: [[manifesto]] · [[frontend/componentes]] · [[frontend/paginas]] · [[frontend/estado]] · [[backend/api]]

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | 16.1.6 |
| Linguagem | TypeScript | 5.x |
| UI base | React | 19.x |
| Estilização | Tailwind CSS | 4.x |
| Componentes | shadcn/ui (radix-ui + base-ui) | — |
| Ícones | Lucide React | 0.575.x |
| Toasts | Sonner | 2.x |
| State / fetch | TanStack React Query | 5.x |
| HTTP client | Axios | 1.16.x |
| Validação | Zod | 4.x |
| Geração de API | Kubb | 4.37.x |
| Auth (decode) | jwt-decode | 4.x |
| Linter / Formatter | Biome | 2.2.0 |
| Testes unitários | Vitest + Testing Library | 4.x |
| Testes E2E | Playwright | 1.59.x |
| Storybook | Storybook | 10.x |
| Gerenciador de pacotes | pnpm | — |
| Pre-commit hooks | Husky | 9.x |

---

## Estrutura de Pastas

```
frontend/src/
├── app/                 # Next.js App Router
│   ├── page.tsx         # Home (placeholder de inicialização)
│   └── (futuras rotas privadas/públicas)
├── components/          # Componentes globais
│   └── ui/              # Componentes base (button.tsx, etc. — gerados pelo shadcn)
├── lib/                 # Utilitários, formatadores
├── stories/             # Assets de Storybook
└── test/                # Testes E2E (Playwright)
```

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `next dev` | Servidor de desenvolvimento |
| `build` | `next build` | Build de produção |
| `lint` | `biome check --write --unsafe src/` | Linter + formatter |
| `typecheck` | `tsc --noEmit` | Type checking |
| `test` | `vitest run` | Testes unitários |
| `test:e2e` | `playwright test` | Testes E2E |
| `api:gen` | `kubb generate` | Regenera SDK a partir do OpenAPI |
| `qa` | `format + typecheck + test + test:e2e + build` | Pipeline completo de qualidade |
| `storybook` | `storybook dev -p 6006` | Storybook local |

---

## Geração de API (Kubb)

O Kubb gera automaticamente hooks React Query e tipos TypeScript a partir do schema OpenAPI do backend.

- **Saída:** `src/generated/` — **nunca editar manualmente**
- **Regenerar:** `pnpm api:gen`
- **Plugins ativos:** `plugin-ts`, `plugin-zod`, `plugin-react-query`, `plugin-client`
