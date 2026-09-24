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

## Checkout Mercado Pago dentro do Papirar

1. [x] Trocar a sessão de checkout hospedado por uma intenção autenticada com chave pública e e-mail do usuário.
2. [x] Mostrar o Card Payment Brick tokenizado dentro da página de assinatura; número e CVV não passam pelo servidor Papirar.
3. [x] Criar a assinatura recorrente no Worker com preço/periodicidade fixos no servidor e vinculação por UID + referência imutável da sessão.
4. [x] Impedir reuso, submissão concorrente e sessões vencidas; não liberar Premium antes de receber status `authorized` do Mercado Pago.
5. [x] Atualizar CSP e proxy da API para o SDK e a nova rota autenticada.
6. [x] Configurar `MERCADO_PAGO_PUBLIC_KEY` no Worker e publicar a configuração de produção.
7. [x] Validar sandbox até a renderização do Card Payment Brick com credencial de teste; sem envio de cartão ou cobrança.
8. [x] Rodar typecheck/lint/build do Web e check estático/dry-run do Worker.

Estado: Worker publicado em produção; build Web concluído. A publicação Web será acionada pelo push Git. Uma validação temporária do cartão e o primeiro débito podem ocorrer logo após autorizar a assinatura, conforme comportamento descrito pelo Mercado Pago; a tela informa a validação e a cobrança mensal.

Verificação adicional em 2026-09-24: o painel Mercado Pago já tinha a URL de produção e o evento “Planos e assinaturas” selecionado; no Worker, o secret `MERCADO_PAGO_WEBHOOK_SECRET` está presente. A configuração de teste segue sem URL, pois o Worker está usando credenciais de produção. A chave pública de produção foi adicionada à configuração e o Worker foi publicado (versão `86703c2a-0d33-4d0f-82d3-2e5dfe6af476`). Sandbox e entrega de webhook continuam sem validação end-to-end; nenhuma compra/cobrança real foi feita.

### Diagnóstico sandbox em 2026-09-24

- A página local `/dashboard/assinatura` encaminhava a intenção de checkout ao Worker de produção; a resposta `201` confirma que uma sessão temporária era gravada no D1 de produção mesmo sem envio de cartão. A rota local agora exige explicitamente `PAPIRAR_BILLING_WORKER_URL` em loopback e rejeita destino remoto, mantendo produção fixada apenas fora de desenvolvimento.
- A inicialização do Brick agora registra nome/mensagem do erro do SDK sem dados de cartão, para permitir diagnosticar `Bricks.create`.
- Typecheck, lint e `git diff --check` passaram após as alterações.
- Sandbox ainda não foi executado: o painel informa que credenciais de teste precisam ser ativadas e apresenta consentimento de dados/termos e verificação reCAPTCHA. Essa confirmação precisa ser feita pelo titular da conta. Depois, o Worker local precisa receber o par de credenciais sandbox correspondente (chave pública e Access Token de teste) e usar D1 local. Nenhuma compra foi enviada.

Atualização em 2026-09-24: com a ativação das credenciais pelo titular, o fluxo local foi isolado no Worker loopback com D1 local e credenciais sandbox. A causa do Brick travado foi uma diretiva `connect-src` sem `https://*.mlstatic.com`, que bloqueava o arquivo de idioma usado na inicialização. CSP ajustado (`connect-src`, `worker-src` e recursos de imagem observados); o formulário apareceu na rota `/dashboard/assinatura`, com campos de cartão em iframes do Mercado Pago. Nenhum dado de cartão foi digitado e nenhum pagamento/assinatura foi enviado. Typecheck, lint e `git diff --check` passaram. Autorização de cartão e webhook permanecem pendentes.

Atualização de interface em 2026-09-24: o formulário agora abre em modal central no desktop e painel ancorado na parte inferior em telas móveis, com altura máxima, rolagem interna e respeitando a área segura inferior. O controlador do Brick é desmontado ao fechar o modal. Validado visualmente no navegador local; sem submeter pagamento.
