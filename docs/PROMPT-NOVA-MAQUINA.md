# Prompt de continuidade para uma nova máquina

Copie o conteúdo abaixo e envie ao Codex na nova máquina depois de clonar o repositório.

```text
Quero continuar o desenvolvimento do projeto Controle de Solda da Inventus Power.

Repositório:
https://github.com/Iuran-Freire/controle-de-solda.git

Aplicação publicada:
https://controle-solda.iuranhumberto99.workers.dev/

Antes de alterar qualquer código:
1. Clone ou atualize a branch main do repositório.
2. Leia AGENTS.md, README.md, CLOUDFLARE.md e a pasta docs.
3. Confira `git status`, `git log -5 --oneline` e a estrutura atual do projeto.
4. Instale as dependências com Node.js 22.13 ou superior.
5. Execute `npm run check`, `npm test` e `npm run build` para estabelecer a situação inicial.
6. Se a documentação divergir do código ou do ambiente publicado, trate o código e a configuração real como evidência principal e atualize a documentação.

Contexto do produto:
- É um sistema em português do Brasil para controle diário de estações de solda.
- Não há tela de login por decisão do responsável. A identificação é feita pelo campo de inspetor no formulário.
- O Cloudflare Access foi removido do endereço publicado. Confirme o estado atual antes de mudar segurança ou acesso.
- O sistema permite cadastrar, editar e excluir estações. A exclusão deve sempre pedir confirmação antes de acontecer e deve sincronizar entre os dispositivos.
- A versão mobile precisa permanecer compacta e responsiva, especialmente os cartões da tela Estações.
- O sistema trabalha offline: salva primeiro no IndexedDB do aparelho e depois sincroniza com a base central.
- Não descarte registros pendentes e não marque nada como sincronizado sem confirmação explícita da API.
- Conflitos devem permanecer visíveis para análise; inspeções existentes não podem ser sobrescritas silenciosamente.

Arquitetura atual:
- `frontend/presentation`: telas.
- `frontend/application`: estado, casos de uso e relatórios.
- `frontend/infrastructure/offline`: IndexedDB, atualização e sincronização do navegador.
- `frontend/components/ui`: componentes visuais.
- `frontend/styles`: estilos globais.
- `backend/api`: implementação da API `/api/sync`.
- `backend/infrastructure`: acesso ao Cloudflare D1.
- `backend/db`: esquema Drizzle do banco.
- `shared/domain`: tipos, validações e cálculos compartilhados.
- `app`: somente adaptadores mínimos exigidos pelo framework.

Regras de arquitetura:
- Preserve a separação explícita entre `frontend`, `backend` e `shared`.
- O frontend e o backend podem importar `shared`; eles não devem importar implementações um do outro.
- `shared/domain` não deve depender de React, navegador, IndexedDB, Cloudflare ou componentes de interface.
- Não volte a criar pastas soltas `components`, `db`, `hooks`, `lib` ou `src` na raiz.
- Alguns arquivos de configuração precisam permanecer na raiz por exigência das ferramentas. O VS Code já agrupa esses arquivos visualmente.

Stack:
- TypeScript, React 19, Vinext/Vite, Tailwind, shadcn, Recharts, IndexedDB, QR Code, ZXing, Drizzle e Cloudflare Worker/D1.
- PostgreSQL e Supabase não estão conectados.
- O D1 é a base central compartilhada entre os dispositivos.
- O IndexedDB é a base local de cada navegador e contém também pendências ainda não enviadas.

Sincronização:
- A sincronização roda ao abrir o aplicativo, ao recuperar a rede, periodicamente com o app aberto e pelo botão manual.
- Estações de outro aparelho aparecem após serem enviadas ao D1 e baixadas pelo dispositivo atual.
- Cadastros e exclusões usam ID estável e revisão para sincronização.
- Dados locais pendentes do computador ou celular antigo não aparecem automaticamente na nova máquina. Antes de abandonar o aparelho antigo, sincronize e exporte o backup JSON.
- A API fica em `backend/api/sync.ts`; o arquivo `app/api/sync/route.ts` apenas exporta GET e POST.

Banco e publicação:
- Banco central: Cloudflare D1, binding `DB`.
- Esquema: `backend/db/schema.ts`.
- Migrações: `drizzle/`.
- Worker de produção: `controle-solda`.
- Nunca grave tokens, códigos de autenticação, senhas ou IDs secretos no código ou no Git.
- Na nova máquina, autentique a CLI quando necessário com `npx wrangler login` e confira a conta com `npx wrangler whoami`.
- Não crie outro D1 se o banco `controle-solda-db` já existir. Liste e reutilize o banco existente.
- Antes de publicar, execute check, testes, build, migrações e dry-run. Depois confirme a aplicação e `/api/sync` no endereço publicado.

Estado conhecido antes desta transferência:
- A estrutura frontend/backend/shared foi concluída.
- O layout mobile dos cartões de estações foi ajustado.
- A exclusão de estação com confirmação e sincronização foi implementada.
- A checagem TypeScript passou.
- Os 22 testes automatizados passaram.
- O build de produção passou.
- As últimas alterações foram enviadas para a branch `main`.

Forma de trabalhar comigo:
- Responda em português do Brasil.
- Quando eu pedir uma mudança, implemente-a por completo, teste e mostre o resultado.
- Preserve meus dados e a sincronização entre dispositivos.
- Faça commits pequenos e claros e envie à branch `main` quando eu pedir commit ou quando estivermos continuando o fluxo já autorizado de entrega.
- Não reorganize novamente a estrutura sem necessidade.
- Quando algo depender do Cloudflare, primeiro inspecione a configuração e o estado real; não invente IDs nem crie recursos duplicados.

Primeira tarefa na nova máquina:
Clone o repositório, abra-o no VS Code, confira se a branch `main` está atualizada, instale as dependências, rode as verificações e me informe o estado do projeto. Não altere comportamento nessa primeira checagem, exceto se encontrar um erro necessário para o projeto iniciar.
```

## Comandos iniciais

```powershell
git clone https://github.com/Iuran-Freire/controle-de-solda.git
cd controle-de-solda
code .
npm install
npm run check
npm test
npm run build
npm run dev
```

As credenciais do Cloudflare e os dados pendentes do IndexedDB não ficam no Git. Sincronize e exporte os dados do aparelho antigo antes da troca.
