# Acompanhamento — correções da auditoria Web

## Objetivo

Aplicar as melhorias e correções registradas em `AUDITORIA_COMPLETA_WEB_2026-09-23.md`, preservando o escopo do Papirar Web e sem publicar.

## Etapas

1. [x] Substituir CSP inline por nonce por requisição compatível com Next.js dinâmico; propagar nonce aos scripts próprios e JSON-LD.
2. [x] Fazer o webhook de billing falhar fechado quando IDs de associação não identificarem uma sessão; não associar por e-mail.
3. [x] Corrigir promessas de offline/criptografia e remover rating sem fonte do conteúdo público/JSON-LD.
4. [x] Corrigir `.env.example` para refletir a configuração Web atual e deixar a administração jurídica explicitamente indisponível durante a migração.
5. [x] Resolver os erros atuais do ESLint sem desativar regras globais.
6. [x] Atualizar o relatório com alterações feitas e limites de validação.

## Estado final

- Implementação e verificações estáticas concluídas em 2026-09-23.
- `papirar-web`: `npm run typecheck` e `npm run lint` passaram.
- `cloudflare-worker`: `npm run check` passou.
- Sem testes automatizados, build, navegador, preview publicado, login real, webhook ou sandbox de pagamentos nesta execução.
- A administração do catálogo continua intencionalmente indisponível até haver endpoint Worker com autorização administrativa validada no servidor.

## Limites

- Não alterar Flutter/Android, secrets, dados remotos ou configurações de produção.
- Não publicar/deployar.
- CSP nonce força rendering dinâmico; revisar esse custo e registrar que runtime publicado permanece pendente sem preview autorizado.

## Histórico

- 2026-09-23: início; lida a documentação local de CSP e Proxy do Next.js 16.
- 2026-09-23: correções aplicadas; typecheck, lint e check estático do Worker passaram. Runtime e integração permanecem pendentes.
- 2026-09-23: configuração recebeu fluxo de exclusão com confirmação, reautenticação e limpeza dos dados no Worker; typecheck, lint e check do Worker passaram. Exclusão real/conta controlada ainda não foi exercitada.
