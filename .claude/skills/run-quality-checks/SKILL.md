---
name: run-quality-checks
description: Executa a suíte de qualidade do projeto via Makefile (testes, lint, typecheck, build). Use após implementar código para validar que nada quebrou.
user-invocable: false
---

# Run Quality Checks

Executa os checks de qualidade descobertos na skill `discover-project-context`.

## 1. Estratégia de Execução

Use os targets do Makefile descobertos anteriormente. Prioridade:

### 1a. Target de QA completo (preferido — roda tudo de uma vez)

```bash
make qa 2>/dev/null || make check 2>/dev/null || make ci 2>/dev/null || make verify 2>/dev/null
```

Se algum desses existir e cobrir tudo, **use apenas ele** e pule os passos 1b-1d.

### 1b. Testes (se não há target de QA)

```bash
make test 2>/dev/null || make tests 2>/dev/null || make unit 2>/dev/null
```

### 1c. Lint / Format

```bash
make lint 2>/dev/null || make format 2>/dev/null
```

### 1d. Type check

```bash
make typecheck 2>/dev/null || make types 2>/dev/null || make mypy 2>/dev/null
```

### 1e. Build

```bash
make build 2>/dev/null
```

## 2. Fallback — Sem Makefile

Se não há Makefile, use comandos diretos baseados na stack identificada:

**Python/Django:**
```bash
python manage.py check
python manage.py makemigrations --check
pytest
```

**Node/Next.js:**
```bash
cd {frontend_dir} && npx tsc --noEmit
cd {frontend_dir} && npx eslint src/  # ou biome check
```

## 3. IDE Diagnostics (sempre)

```
mcp__ide__getDiagnostics
```

## 4. Interpretar Resultados

| Resultado | Severidade | Ação |
|-----------|-----------|------|
| Testes falhando | 🔴 Blocker | Registrar quais testes falharam e stack trace |
| Errors de lint | 🔴 Blocker | Registrar arquivo e linha |
| Type errors | 🔴 Blocker | Registrar arquivo e linha |
| Build falhou | 🔴 Blocker crítico | Registrar erro completo |
| Warnings de lint | 🟡 Warning | Registrar para relatório |
| Tudo passando | ✅ OK | Registrar "Suíte de qualidade: PASS" |

## Saída esperada

Resultado consolidado para uso pelo workflow que a invocou:
```
Qualidade: PASS / FAIL
- Testes: OK / FAIL (X falhas)
- Lint: OK / FAIL (Y erros)  
- Types: OK / FAIL (Z erros)
- Build: OK / FAIL
```
