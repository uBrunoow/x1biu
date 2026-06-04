---
name: review-code-changes
description: Revisa as mudanças de código cobrindo qualidade, segurança (OWASP) e performance. Gera relatório classificado por severidade e propõe correções. Use no fluxo do task-code-review.
user-invocable: false
---

# Review Code Changes

Revisa o código dos arquivos em stage (ou diff da task) em três dimensões: qualidade, segurança e performance.

## 1. Coletar Código para Review

```bash
git diff --staged
git diff --staged --stat
git status --short
```

Se não houver staged, compara contra main:
```bash
git diff main --stat
git diff main
```

## 2. Análise de Qualidade

Leia as guidelines antes de avaliar padrões:

```bash
obsidian read file="guidelines"
```

Fallback: `mcp__obsidian-docs__read_file(path="docs/guidelines.md")`

- [ ] **DRY**: Código duplicado que poderia ser extraído?
- [ ] **Nomenclatura**: Nomes claros e consistentes com o projeto?
- [ ] **Complexidade**: Funções longas (>50 linhas) ou aninhamentos excessivos (>3 níveis)?
- [ ] **Dead code**: Código comentado ou variáveis não utilizadas?
- [ ] **Padrões**: Segue o estilo das guidelines lidas acima?
- [ ] **Types**: TypeScript/tipos corretos? Sem `any` desnecessário?

## 3. Análise de Segurança (OWASP Top 10)

- [ ] **SQL Injection**: Queries parametrizadas? ORM usado corretamente?
- [ ] **XSS**: Inputs sanitizados? HTML escapado no frontend?
- [ ] **CSRF**: Mutações protegidas?
- [ ] **Autenticação/Autorização**: Endpoints verificam permissão?
- [ ] **Exposição de dados**: Campos sensíveis na API? Logs com dados pessoais?
- [ ] **Validação de input**: Dados externos validados na entrada do sistema?

## 4. Análise de Performance

**Backend:**
- [ ] **N+1 queries**: Loop com queries dentro? `select_related`/`prefetch_related` necessário?
- [ ] **Índices**: Campos usados em `filter`/`order_by` têm índice?
- [ ] **Bulk operations**: Salvamentos em loop que poderiam ser `bulk_create`/`bulk_update`?

**Frontend:**
- [ ] **Re-renders**: Componentes re-renderizando desnecessariamente?
- [ ] **Memoização**: `useMemo`/`useCallback` onde há cálculo custoso?
- [ ] **Bundle size**: Imports desnecessários ou libs pesadas?

## 5. Gerar Relatório

```markdown
## Code Review

### Resumo
- Arquivos revisados: X
- 🔴 Blockers: Y | 🟡 Warnings: Z | 🔵 Suggestions: W

### Problemas Encontrados

#### 🔴 Blockers
1. **[arquivo:linha]** — [descrição]
   **Correção:** [como corrigir]

#### 🟡 Warnings
...

#### 🔵 Suggestions
...

### Checklist
- [x/❌] Qualidade: OK/Problemas encontrados
- [x/❌] Segurança: OK/Problemas encontrados
- [x/❌] Performance: OK/Problemas encontrados
```

## 6. Propor Correções para Blockers

```
AskUserQuestion(questions: [{
  question: "Encontrei X blockers. Corrigir automaticamente?",
  options: [
    { label: "Corrigir todos os blockers" },
    { label: "Revisar um a um" },
    { label: "Apenas documentar — corrigirei manualmente" }
  ]
}])
```

Aplicar correções aprovadas com `Edit`.

## Saída esperada

- Relatório completo classificado
- Blockers resolvidos (ou documentados para resolução manual)
- Status: APROVADO (sem blockers) / REPROVADO (com blockers pendentes)
