# No Over-Engineering

Escreva o mínimo necessário para resolver o problema. Nunca adicione complexidade antecipada.

## Proibido

- Criar abstrações para "possível uso futuro" — três casos idênticos justificam uma abstração, não um
- Adicionar parâmetros opcionais que nenhum caller usa
- Criar helpers para operações usadas uma única vez
- Adicionar error handling para cenários que não podem acontecer
- Usar feature flags, backwards-compatibility shims ou renomear `_vars` não utilizadas
- Refatorar código adjacente que não foi pedido
- Adicionar logging, métricas ou instrumentação além do que foi solicitado
- Criar arquivos de configuração, README ou documentação sem ser pedido

## Obrigatório

- Solução mais simples que passa nos testes
- Nomes descritivos em vez de comentários explicando o quê
- Editar arquivos existentes em vez de criar novos
- Deletar código morto em vez de comentar

## Quando houver dúvida

Prefira a solução com menos linhas, menos arquivos e menos dependências.
Três linhas similares são melhores que uma abstração prematura.
