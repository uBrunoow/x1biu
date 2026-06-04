# Security

Regras de segurança que se aplicam em qualquer stack, linguagem ou tipo de projeto.

## Credenciais e Segredos

- Nunca commitar arquivos `.env`, `.env.local`, `.env.production` ou qualquer variante
- Nunca escrever API keys, tokens, senhas ou secrets diretamente no código
- Sempre usar variáveis de ambiente para qualquer valor sensível
- Se encontrar um secret exposto no código, sinalize imediatamente antes de continuar

## Dados e Privacidade

- Nunca logar dados pessoais: CPF, email, telefone, endereço, nome completo
- Nunca logar tokens de autenticação, API keys ou session IDs
- Nunca expor stack traces ou detalhes internos em respostas HTTP de produção
- Campos sensíveis em APIs devem ser explicitamente excluídos dos serializers

## Inputs e Outputs

- Toda entrada externa (body, query params, headers, arquivos) deve ser validada na borda do sistema
- Nunca concatenar inputs de usuário em queries SQL — sempre usar ORM ou queries parametrizadas
- Nunca usar `eval()`, `exec()` ou equivalentes com dados externos
- HTML gerado a partir de dados do usuário deve ser escapado

## Autenticação e Autorização

- Novos endpoints precisam de autenticação por padrão — ausência de auth é exceção explícita
- Nunca expor IDs sequenciais em URLs públicas sem verificar ownership
- Operações destrutivas (delete, update em massa) precisam de confirmação de permissão

## Dependências

- Nunca instalar pacotes de fontes desconhecidas
- Preferir dependências com manutenção ativa e histórico de segurança
