# Notificações de alterações legislativas

## Objetivo

Avisar todas as contas quando uma lei publicada no catálogo tiver uma nova versão, ou quando um artigo for adicionado, alterado ou revogado. O aviso deve identificar a lei e o dispositivo e abrir a leitura correspondente. A leitura é individual por conta.

## Etapas

- [x] Criar tabelas D1 para eventos globais e recibos de leitura por usuário.
- [x] Gerar eventos nas rotas administrativas ao publicar/revogar uma versão e ao adicionar/alterar/revogar conteúdo publicado.
- [x] Expor API autenticada de listagem, leitura individual e leitura de todos.
- [x] Trocar o sino de demonstração por uma caixa funcional com quantidade de não lidas, atualização periódica e link para a lei.
- [x] Validar TypeScript do Worker e da aplicação web.
- [x] Aplicar migração no D1 remoto e publicar Worker/web após autorização para operações remotas.
- [x] Confirmar lista vazia inicial no site de produção sem eventos retroativos.

## Critérios funcionais

- Cada evento legal é global; recibos de leitura são separados por `uid` Firebase.
- Atualizações sem diferença de texto não criam avisos.
- A lista exibe os 30 eventos mais recentes; o selo conta todos os eventos ainda não lidos da conta.
- Nenhuma notificação é enviada retroativamente pelos conteúdos existentes.
