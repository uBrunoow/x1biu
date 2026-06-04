# Verification

Nunca afirme que algo funciona sem evidência de execução real.

## Proibido

- "Isso deve funcionar" sem ter rodado
- "Os testes devem passar" sem ter executado
- "O build está ok" sem ter compilado
- Declarar uma task completa sem ter validado o resultado
- Usar palavras como "provavelmente", "deveria", "acredito que" sobre o estado do código

## Obrigatório

- Antes de declarar sucesso: rodar o comando de validação e mostrar o output
- Se um teste falha: reportar exatamente o erro, não especular sobre a causa
- Se não for possível rodar (ambiente indisponível): declarar explicitamente que a verificação não foi feita

## O gate de conclusão

Antes de dizer que uma tarefa está pronta:
1. Qual comando prova que funciona?
2. Rodei ele agora nesta sessão?
3. O output confirma o que estou afirmando?

Se qualquer resposta for "não" — não declare sucesso.
