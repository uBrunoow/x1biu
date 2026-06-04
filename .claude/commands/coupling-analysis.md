---
description: Analisa acoplamento entre módulos usando o modelo tridimensional (força, distância, volatilidade) - identifica problemas arquiteturais e sugere refatorações
argument-hint: "[módulo ou área do codebase]"
allowed-tools: Bash(git log:*), Bash(git diff:*), Glob, Grep, Read, Task, AskUserQuestion
---

# /coupling-analysis $ARGUMENTS

## Quando usar

Use quando quiser entender a saúde arquitetural do codebase:

- "Esses módulos estão acoplados demais?"
- "Por que mudanças em A quebram B?"
- "Qual a qualidade das integrações entre serviços?"
- "O que preciso desacoplar antes de refatorar?"

## Modelo de análise

O acoplamento é avaliado em 3 dimensões:

| Dimensão | Pergunta |
|----------|---------|
| **Força** | O quê é compartilhado? (Contract → Model → Functional → Intrusive) |
| **Distância** | Onde estão os módulos? (mesmo pacote → serviços diferentes) |
| **Volatilidade** | Com que frequência mudam? (genérico → domínio core) |

**Fórmula de risco**: `MANUTENÇÃO = FORÇA × DISTÂNCIA × VOLATILIDADE`

## Diagnósticos

| Força | Distância | Volatilidade | Diagnóstico |
|-------|-----------|-------------|-------------|
| Alta | Alta | Alta | 🔴 CRÍTICO — refatorar |
| Alta | Baixa | Alta | 🟢 BOM — coesão (vivem juntos) |
| Baixa | Alta | Alta | 🟢 BOM — acoplamento frouxo |
| Alta | Alta | Baixa | 🟡 ACEITÁVEL — forte mas estável |

## O que este comando produz

1. **Mapa de dependências** anotado com tipo de acoplamento
2. **Issues identificadas** por severidade (crítico → moderado → baixo)
3. **Padrões positivos** encontrados
4. **Recomendações priorizadas** de refatoração

## Complementar com

```
/domain-analysis   # Identificar fronteiras de domínio antes de desacoplar
/design-doc        # Documentar a arquitetura alvo após análise
```

---

Use a skill `coupling-analysis` com os argumentos: $ARGUMENTS
