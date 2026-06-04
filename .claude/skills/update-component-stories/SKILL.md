---
name: update-component-stories
description: Atualiza ou cria stories de componentes frontend (Storybook/Histoire) e o arquivo de histórico do design system. Use no fluxo do sync-docs-frontend.
user-invocable: false
---

# Update Component Stories

Cria ou atualiza stories dos componentes alterados e o histórico do design system.

## 1. Identificar Componentes Alterados

```bash
git diff --staged --name-only | grep -E "\.(tsx|jsx|vue)$" | grep -v ".stories."
```

Para `--component <nome>`:
```
Glob("{frontend_dir}/src/components/**/*{nome}*")
```

## 2. Analisar Cada Componente

Para cada componente identificado:

```
Read("<caminho do componente>")
```

Extraia:
- **Props** (nome, tipo, obrigatório, default)
- **Variantes** (ex: `variant="primary|secondary"`)
- **Estados** (loading, disabled, error)
- **Callbacks** (onX, handleX)
- **Componentes filhos/composição**

## 3. Verificar Story Existente

```
Glob("{frontend_dir}/src/**/*{NomeComponente}*.stories.*")
```

## 4. Criar/Atualizar Story

Use o framework encontrado em `discover-project-context` (Storybook, Histoire, etc.).

**Storybook (padrão):**

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { NomeComponente } from "./NomeComponente";

const meta = {
  title: "<Categoria>/<NomeComponente>",  // ex: "UI/Button"
  component: NomeComponente,
  tags: ["autodocs"],
  argTypes: {
    // Documentar CADA prop
    nomeProp: {
      description: "O que esta prop controla",
      control: { type: "select" },  // ou text, boolean, number, color
      options: ["opcao1", "opcao2"],
    },
  },
} satisfies Meta<typeof NomeComponente>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories obrigatórias:
export const Default: Story = { args: { /* valores padrão */ } };

// Para cada variante:
export const Primary: Story = { args: { variant: "primary" } };

// Para cada estado relevante:
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
```

Categorias para o `title`:
`UI` | `Forms` | `Layout` | `Navigation` | `Feedback` | `Data Display` | `Typography`

## 5. Atualizar history-books.md (se existir)

Localize o arquivo usando o mapa de docs (procure por "history", "design-system", "component"):

```
Read("<docs/frontend/history-books.md ou equivalente>")
```

Adicione ou atualize a entrada do componente:

```markdown
### NomeComponente

**Arquivo:** `src/components/NomeComponente.tsx`
**Status:** ✅ Estável

#### Props
| Prop | Tipo | Default | Obrigatória | Descrição |
|------|------|---------|-------------|-----------|
| label | `string` | — | ✅ | Texto exibido |
| variant | `'primary' \| 'secondary'` | `'primary'` | ❌ | Estilo visual |

#### Variantes
- **primary** — ação principal
- **secondary** — ações alternativas

#### Exemplo
```tsx
<NomeComponente label="Confirmar" onClick={handleConfirm} />
```
```

## Saída esperada

Lista de stories criadas/atualizadas e entradas adicionadas ao history-books.
