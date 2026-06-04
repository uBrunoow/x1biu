---
description: Analisa domínios de negócio e sugere fronteiras de serviço usando DDD Strategic Design - mapeia subdomínios Core, Supporting e Generic
argument-hint: "[área ou módulo a analisar]"
allowed-tools: Glob, Grep, Read, Task, AskUserQuestion
---

# /domain-analysis $ARGUMENTS

## Quando usar

Use para entender como o codebase está organizado em termos de domínio de negócio:

- "Quais são os domínios deste codebase?"
- "Onde devo traçar as fronteiras entre serviços?"
- "Quais módulos pertencem ao domínio core?"
- "Como organizar o código seguindo DDD?"

## O que este comando produz

1. **Mapa de domínios** com classificação (Core / Supporting / Generic)
2. **Bounded Contexts sugeridos** com linguagem ubíqua
3. **Matriz de coesão** entre domínios
4. **Issues de baixa coesão** com recomendações
5. **Padrões de integração** sugeridos entre contextos

## Classificação de subdomínios

| Tipo | Volatilidade | Indicadores |
|------|-------------|-------------|
| **Core Domain** | Alta | Lógica proprietária, vantagem competitiva |
| **Supporting Subdomain** | Baixa | Suporta o core, regras específicas do negócio |
| **Generic Subdomain** | Mínima | Auth, billing, email, logging |

## Complementar com

```
/coupling-analysis   # Analisar o acoplamento entre domínios identificados
/design-doc          # Documentar a arquitetura de bounded contexts
```

---

Use a skill `domain-analysis` com os argumentos: $ARGUMENTS
