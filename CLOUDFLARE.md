# Publicação na conta pessoal Cloudflare

O Worker de destino é `controle-solda`. A configuração do Sites permanece em
`.openai/hosting.json`. O aplicativo usa o mesmo código nas duas hospedagens.

1. Autenticar com `npx wrangler login` e verificar a conta com `npx wrangler whoami`.
2. Confirmar no painel que o Access protege **todo o tráfego** do Worker,
   permitindo `inventuspower.com` e o endereço exato `iuranhumberto99@gmail.com`.
3. Criar o banco uma única vez com `npx wrangler d1 create controle-solda-db`.
   Se já existir, reutilizar o ID retornado por `npx wrangler d1 list`.
4. Executar `npm run check`, `npm test` e `npm run build`.
5. Executar `node scripts/prepare-cloudflare.mjs ID_DA_CONTA ID_DO_BANCO`.
6. Aplicar o schema existente:
   `npx wrangler d1 migrations apply DB --remote --config wrangler.cloudflare.json`.
7. Conferir o pacote:
   `npx wrangler deploy --dry-run --config wrangler.cloudflare.json`.
8. Publicar com `npx wrangler deploy --config wrangler.cloudflare.json`.
9. Confirmar que `/` e `/api/sync` exigem autenticação em uma sessão sem login.
   Após login, testar cadastro, sincronização e instalação Android.

O banco novo começa vazio. Os registros existentes no Sites ou no navegador
antigo não são transferidos automaticamente. Conservar esses registros até
planejar e validar a importação, incluindo os registros pendentes de cada aparelho.

Para abrir offline, instalar/preparar o aplicativo com internet primeiro.
A sincronização requer conexão e sessão válida do Cloudflare Access.
Não colocar senhas, códigos de e-mail ou tokens no código ou no Git.
