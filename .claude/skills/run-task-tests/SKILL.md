---
name: run-task-tests
description: Executa a suíte de testes relacionados à task - unitários, integração e E2E conforme configuração do projeto. Valida cobertura e critérios técnicos de teste. Use no fluxo do task-tests.
user-invocable: false
---

# Run Task Tests

Executa os testes do projeto focando nos arquivos modificados pela task. Avalia resultados e cobertura.

## 1. Identificar Arquivos Modificados

```bash
git diff --name-only HEAD~1..HEAD
git diff --name-only --staged
```

Liste os arquivos modificados pela task para direcionar a execução dos testes.

## 2. Detectar Configuração de Testes do Projeto

Identifique o que está disponível:

```bash
# Backend
ls backend/ | grep -E "pytest.ini|setup.cfg|pyproject.toml" 2>/dev/null
cat pyproject.toml | grep -A5 "\[tool.pytest\]" 2>/dev/null

# Frontend
ls frontend/ | grep -E "vitest.config|jest.config|playwright.config|cypress.config" 2>/dev/null
cat frontend/package.json | grep -E '"test"|"e2e"' 2>/dev/null
```

Identifique os targets disponíveis no Makefile:

```bash
cat Makefile | grep -E "^test|^qa|^lint" 2>/dev/null
```

## 3. Executar Testes

Execute na ordem: unitários → integração → E2E.

### 3a. Testes Backend (se houver arquivos Python modificados)

**Via Makefile (preferido):**
```bash
make test-backend 2>/dev/null || make test 2>/dev/null
```

**Via pytest direto (fallback):**
```bash
cd backend && python -m pytest -v --tb=short 2>&1 | tail -50
```

**Com cobertura (se `--coverage` solicitado):**
```bash
cd backend && python -m pytest --cov=. --cov-report=term-missing --cov-report=json -v 2>&1 | tail -80
```

### 3b. Testes Frontend (se houver arquivos TS/JS modificados)

**Via Makefile (preferido):**
```bash
make test-frontend 2>/dev/null
```

**Via pnpm direto (fallback):**
```bash
cd frontend && pnpm test --run 2>&1 | tail -50
```

**Com cobertura (se `--coverage` solicitado):**
```bash
cd frontend && pnpm test --run --coverage 2>&1 | tail -80
```

### 3c. Testes E2E (se configurado e solicitado)

```bash
make test-e2e 2>/dev/null || cd frontend && pnpm e2e 2>/dev/null
```

Os testes E2E só devem rodar se: (a) playwright.config ou cypress.config existir, e (b) o ambiente estiver disponível.

## 4. Parsear e Apresentar Resultados

Após a execução, apresente um resumo estruturado:

```markdown
## Resultados dos Testes

### Backend
- **Status:** ✓ Passou / ✗ Falhou
- **Total:** <passed>/<total> testes
- **Cobertura:** <X>% (se disponível)
- **Falhas:** <lista de testes que falharam, se houver>

### Frontend
- **Status:** ✓ Passou / ✗ Falhou
- **Total:** <passed>/<total> testes
- **Cobertura:** <X>% (se disponível)
- **Falhas:** <lista de testes que falharam, se houver>

### E2E
- **Status:** ✓ Passou / ✗ Falhou / ⊘ Não executado
- **Total:** <passed>/<total> cenários
```

## 5. Verificar Critérios Técnicos de Teste

Leia os CA-T da task que se referem a testes:

```
mcp__backlog__task_view(id: "<task-ID>")
```

Filtre os critérios com "teste" no texto e verifique quais foram atendidos pelos resultados acima.

## 6. Classificar o Resultado Final

**Sucesso (todos passaram):** Prosseguir para finalização.

**Falhas não críticas** (testes de features não relacionadas à task):
- Registrar na task como débito técnico pré-existente
- Perguntar se o usuário quer bloquear ou aceitar

**Falhas críticas** (testes relacionados aos arquivos modificados):
- Exibir o stack trace completo das falhas
- Bloquear a finalização e perguntar como proceder

## Saída esperada

Relatório de resultados com status por suite, cobertura (se solicitado) e lista de CA-T de teste verificados. Contexto pronto para `finalize-backlog-task`.
