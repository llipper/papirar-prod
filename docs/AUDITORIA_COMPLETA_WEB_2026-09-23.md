# Auditoria completa do Papirar Web

**Data:** 23/09/2026
**Escopo:** `papirar-web` (Next.js) e apenas os contratos relevantes do Cloudflare Worker usados pelo Web. Flutter/Android, credenciais de produção, consoles dos provedores, deploy e testes ativos contra produção ficaram fora do escopo.

## Resumo executivo

Não encontrei, na revisão estática, um caminho confirmado de tomada de conta, bypass de autorização ou acesso cruzado entre usuários. A arquitetura web está alinhada à decisão de usar Firebase somente para autenticação e Cloudflare para dados: não há chamadas Firestore no código-fonte do cliente; chamadas ao Worker levam Firebase ID token; as rotas do Worker que li consultam dados usando UID autenticado. O redirecionamento `next` é limitado a caminhos locais, e as anotações renderizam Markdown limitado sem inserir HTML, aceitando links apenas HTTP/HTTPS.

Há riscos e lacunas que merecem correção antes de tratar o Web como auditado para produção:

1. O CSP permite scripts inline em produção (`'unsafe-inline'`). Isso reduz bastante a proteção contra XSS. O histórico registra uma tela branca quando a política foi endurecida; a configuração atual evita essa regressão conhecida, mas a resposta publicada não foi revalidada nesta auditoria.
2. O webhook de Mercado Pago pode associar uma assinatura à sessão de checkout mais recente pelo e-mail do pagador quando não encontra a associação por ID. É um fallback frágil de identidade e precisa ser validado em sandbox; não demonstrei exploração.
3. A comunicação pública promete leitura offline criptografada com AES-256, mas o código Web grava textos legais diretamente no IndexedDB, sem criptografia. Também não encontrei mecanismo Web que prove as alegações de rating agregado publicadas no JSON-LD.
4. A administração do catálogo jurídico está deliberadamente desativada no Web até existir endpoint administrativo seguro no Worker.

## Achados

### P2 — CSP permite scripts inline em produção

`middleware.ts` define `script-src 'self' 'unsafe-inline'` também em produção. Como o HTML servido pode conter scripts inline do Next.js, isso preserva a hidratação, mas diminui a capacidade da CSP de bloquear scripts injetados. Não encontrei um sink explorável ligado a entrada de usuário nesta revisão; portanto, é uma lacuna de defesa, não uma XSS demonstrada.

**Evidência:** `middleware.ts`, função `contentSecurityPolicy`, linha 38. O histórico do projeto registra que remover inline scripts/usar nonce sem HTML compatível causou bloqueio de scripts e tela branca. A versão publicada não foi inspecionada nesta execução.

**Ação:** manter a política atual até preparar uma estratégia CSP compatível com o modo de renderização/deploy e validar hydration em preview real. Não publicar alteração de CSP baseada somente em typecheck.

### P2 — Fallback do webhook associa conta pelo e-mail

No Worker, o processamento do webhook consulta primeiro o `preapproval_id`, depois `external_reference`, e por fim usa `payer_email` para escolher a sessão mais recente. E-mail é atributo mutável e não é uma chave estável de identidade; se os identificadores fortes estiverem ausentes, atrasados ou inconsistentes, a associação pode creditar Premium à conta errada. As etapas de ID reduzem a exposição normal, e não foi demonstrado que o provedor omita esses campos no fluxo implantado.

**Evidência:** `cloudflare-worker/src/index.ts`, aproximadamente linhas 1204–1220. Checkout cria uma sessão vinculada ao UID antes de redirecionar ao provedor.

**Ação:** validar com eventos sandbox e duas contas controladas. Preferir falhar fechado/quarentenar evento sem ID de sessão verificável em vez de atribuir por e-mail.

### P2 — Promessa de criptografia offline contradiz o armazenamento Web

FAQ e landing afirmam que as leis Premium podem ser baixadas para leitura offline com criptografia AES-256. O Web mantém o texto em IndexedDB sem `crypto.subtle`, encrypt/decrypt ou outra camada de criptografia. O cache só é preenchido depois de obter uma leitura online e não contém os áudios/entitlements, então também não comprova toda a promessa apresentada.

**Evidência:** `components/landing/landing-page.tsx`, linhas 79–81; `lib/biblioteca/law-reading-cache.ts`, funções `openDatabase`, `readCachedLawReading` e `writeCachedLawReading` (linhas 35–94). O mesmo claim aparece no JSON-LD de `app/page.tsx`, linhas 85–89.

**Ação:** remover a alegação AES-256 do Web ou implementar e validar criptografia e o fluxo offline anunciado. Esclarecer com precisão quando o conteúdo fica disponível offline.

### P2 — Administração do catálogo indisponível

O serviço administrativo sempre lança uma mensagem de indisponibilidade durante a migração. A administração jurídica do Web não está funcional; isso é uma lacuna de produto/operação, não um bypass de autorização. A rota continua protegida pela sessão do dashboard e a checagem de claim `admin` existe no cliente, mas o serviço remoto está intencionalmente bloqueado.

**Evidência:** `lib/admin/legal-catalog-admin-service.ts`, linhas 5–14.

**Ação:** manter explícito que a função está indisponível até existir endpoint Cloudflare que valide a claim administrativa no servidor e aplique autorização em cada operação.

### P3 — Rating estruturado sem fonte verificável no repositório

O JSON-LD publica `ratingValue: 4.9` e `ratingCount: 1250`. Não encontrei fonte de avaliações nem integração que sustente esses valores no Web. Dados estruturados sem suporte podem induzir usuários e mecanismos de busca a erro.

**Evidência:** `app/page.tsx`, linhas 47–51.

**Ação:** remover `aggregateRating` até haver avaliações reais, verificáveis e elegíveis para marcação estruturada.

### P3 — Exemplo de ambiente aponta para Supabase

O `.env.example` contém apenas nomes de variáveis `NEXT_PUBLIC_SUPABASE_*`, embora a arquitetura Web atual use Firebase Auth e Cloudflare Worker. Isso pode induzir configuração errada em um novo ambiente; não encontrei uso dessas variáveis no código-fonte revisado.

**Evidência:** `.env.example`, linhas 1–2.

**Ação:** substituir pelo conjunto de variáveis efetivamente lido pelo Web, sem colocar valores secretos no exemplo.

### P2 — ESLint falha em nove ocorrências

O lint atual termina com 9 erros em 8 arquivos, principalmente nas regras `react-hooks/set-state-in-effect` e `react-hooks/refs`, além de uma interface vazia (`no-empty-object-type`). Isso impede usar ESLint como verificação limpa e aponta padrões de estado/refs que precisam de revisão; não demonstra por si só uma falha de segurança ou comportamento em runtime.

**Evidência:** saída de `npx eslint app components lib middleware.ts next.config.ts --quiet`. Arquivos: `app/dashboard/perfil/page.tsx`, `components/biblioteca/reading/audio/reading-floating-audio-player.tsx`, `components/conteudo/user-content-page.tsx`, `components/dashboard/configuration-page.tsx`, `components/legal/cookie-consent.tsx`, `components/subscription/subscription-management-card.tsx`, `components/ui/carousel.tsx` e `lib/biblioteca/hooks/use-reading-annotations.ts`.

**Ação:** corrigir os avisos de hooks/refs com padrões aceitos pela versão React/ESLint instalada, sem suprimir regras globalmente, e repetir lint.

## Controles observados

- Nenhuma chamada `firebase/firestore`, `firebase/database` ou `firebase/storage` em `app`, `components`, `lib` ou `hooks`; dependências internas do SDK no lockfile não são uso pelo app.
- O Web obtém Firebase ID tokens para perfil, conteúdo de usuário e billing; o Worker valida a identidade antes das rotas protegidas.
- Perfil e progresso são consultados/gravados com UID autenticado; conteúdo pessoal usa consultas com UID e mutações condicionadas a `uid`.
- Áudios passam por `resolveEntitlements` no Worker; usuários sem Premium recebem lista vazia. O texto legal é conteúdo público e fica separado dos URLs/entitlements de áudio.
- O proxy Web de billing usa origem Worker fixa, allowlist de rotas, encaminha apenas Authorization/Content-Type e `no-store`.
- O endpoint `/api/security/log` retorna 404; `/api/internal/send-email` requer segredo de servidor comparado em tempo constante e limita campos depois da autenticação.
- Os guards do dashboard são client-side; dados sensíveis não devem depender deles. Nas rotas de dados inspecionadas, a autorização efetiva fica no Worker.
- A função `safeNext` impede URL externa e `//` no redirect de login.
- A renderização de anotações não injeta HTML e rejeita protocolos de link diferentes de HTTP/HTTPS.

## Validação realizada e limites

- Revisão estática dos guards, autenticação, redirects, perfil/avatar, catálogo/leitura, conteúdo do usuário, áudio, billing, administração, rotas internas, CSP, headers, SEO, privacidade e páginas públicas.
- Na auditoria inicial, `npm run typecheck` passou e o ESLint apontou 9 erros; as correções e o resultado atual estão registrados abaixo.
- Não rodei build, servidor local, browser, pagamento sandbox, upload de arquivo, webhook, fluxo de login real ou acesso ao domínio publicado. Portanto, hydration, redirects OAuth, Mercado Pago e entitlement não estão validados ponta a ponta.

## Remediação aplicada em 23/09/2026

- Substituído `middleware.ts` por `proxy.ts` conforme a convenção do Next.js 16. A CSP agora gera nonce independente por requisição, envia-o nos headers de request/response e aplica-o ao JSON-LD; o layout consulta headers e passa a renderizar dinamicamente. `style-src 'unsafe-inline'` permanece porque a aplicação usa estilos inline. A CSP em preview publicado e a hidratação ainda precisam de inspeção real.
- Removida a associação de checkout do webhook por e-mail. Sem sessão encontrada por `preapproval_id` ou `external_reference`, o Worker registra evento sem dados pessoais do pagador e retorna 503 para falhar fechado e permitir nova tentativa do provedor. A entrega/repetição precisa de validação em sandbox.
- Removidas alegações sem suporte de AES-256, disponibilidade offline permanente, histórico de comparação de alterações e rating agregado 4.9/1250. O texto público agora descreve o cache local de forma limitada e recomenda fonte oficial para confirmar vigência.
- Atualizado `.env.example` para a configuração pública do Worker e removidos nomes antigos de Supabase.
- Mantida a administração do catálogo jurídico explicitamente indisponível durante a migração para Cloudflare, sem ações que pareçam funcionar quando não há endpoint administrativo seguro.
- Corrigidos os problemas encontrados pelo lint em hooks, efeitos, estado de carregamento, carousel, cookie consent e valores/imports não utilizados, sem desligar as regras globais.
- Em ajuste posterior solicitado pelo usuário, adicionada em Configuração a exclusão de conta com digitação de `EXCLUIR`, reautenticação de senha/Google, validação de `auth_time` recente no Worker, bloqueio de assinatura vigente, remoção dos dados pessoais em D1/R2 e exclusão do usuário Firebase Auth. A página pública de exclusão foi atualizada; o fluxo ainda não foi exercitado com conta controlada.

## Verificações após remediação

- `papirar-web`: `npm run typecheck` passou.
- `papirar-web`: `npm run lint` passou sem erros.
- `cloudflare-worker`: `npm run check` passou.
- Não foram executados testes automatizados, build, navegador, preview/deploy, login real, upload ou sandbox/webhook do Mercado Pago. As alterações de CSP e billing têm verificações estáticas, mas ainda requerem validação integrada antes de declarar o fluxo pronto para produção.
- Acompanhar as etapas e os limites em [`ACOMPANHAMENTO_IMPLEMENTACAO_AUDITORIA.md`](ACOMPANHAMENTO_IMPLEMENTACAO_AUDITORIA.md).
