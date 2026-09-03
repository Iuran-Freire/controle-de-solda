# Inventus Power · Controle de Solda

Piloto para digitalizar a verificação diária das estações de solda e a carta I-MR. Usa o logotipo original e a paleta consultada no site oficial da Inventus Power. Interface responsiva em português. Fontes em `docs/IDENTIDADE-VISUAL.md`.

## Rodar no VS Code

Requer Node.js 22.13 ou superior. Abra esta pasta no VS Code.

```sh
npm install
npm run db:generate
npm run db:local
npm run dev
```

Acesse a URL informada no terminal. Tarefas também disponíveis no menu Terminal → Executar tarefa.

## Estrutura

```text
app/                       Entrada, layout, estilos e API /api/sync
components/inspection/     Painel, checklist, estações/QR, histórico, gráficos, sincronização
components/ui/             Primitivos acessíveis shadcn
hooks/use-inspections.ts   Estado compartilhado e atualização da fila
lib/inspection/            Tipos, validação, critérios e cálculo I-MR
lib/offline/               IndexedDB, rascunhos e envio idempotente
lib/server/                Acesso ao banco central
db/schema.ts               Esquema Drizzle
drizzle/                   Migrações versionadas
public/                    Manifesto PWA e ícone
scripts/                   Preparação offline e testes
```

## Stack efetivamente usada

TypeScript + React, Vinext (API de aplicação compatível com Next.js) sobre Vite, shadcn, Recharts, IndexedDB, QRCode e ZXing. A hospedagem Sites usa Cloudflare Worker e D1/SQLite para a base central. **PostgreSQL e Supabase não estão conectados**: eram a proposta inicial; o piloto usa o banco disponível nesta plataforma. As camadas estão separadas para futura migração com a TI.

## Funcionamento

Em **Resultados e I-MR**, selecione o posto e filtre o período pela data de produção e pelo turno. O resumo conta verificações conformes/não conformes por dia e turno. Os gráficos individuais mostram resistência, tensão e temperatura para cada coleta I.T/A.R/F.T, com os limites preservados no registro. A tabela permite conferir os cinco checks. Pendências de envio são identificadas e conflitos ficam fora dos gráficos. As cartas I-MR continuam mostrando a série histórica completa do posto, separadamente dos filtros diários.

Cadastre estações com linha, código, modelo, instrumento, responsável e critérios. Registre inspetor, operador, data de produção, turno, momento, integridade, validade, temperatura, resistência e tensão. Não conformidades exigem observação e ação. Valores em °C, Ω e mV devem ser confirmados com a qualidade.

Os registros são salvos em IndexedDB antes de qualquer envio. A sincronização ocorre ao abrir o app, recuperar rede, a cada minuto com o app aberto e por botão. Não depende de execução em segundo plano. Falhas de rede conservam pendências; o ID é estável em novas tentativas. O servidor confirma cada registro, usa índices únicos para duplicidades e não sobrescreve inspeções. Conflitos permanecem disponíveis para exportação e conciliação manual. A primeira versão não tem edição/exclusão de registros nem importação de backup.

O histórico e as cartas representam os registros disponíveis no aparelho, incluindo pendências identificadas. Os limites estatísticos I-MR são exploratórios, calculados da série ordenada de cada estação: MR absoluta, limites I = média ± 2,66 × MR média; LSC MR = 3,267 × MR média, LIC MR = 0. Não confundir com especificação. Não há homologação de CEP nem regras completas de estabilidade.

## Offline e QR Code

```sh
npm run build
npm start
```

O pós-build gera o service worker com todos os scripts e estilos compilados. Abra a versão de produção via HTTPS (ou localhost) com conexão antes da inspeção. Aguarde a preparação e sincronize cadastros. Depois, o app pode abrir sem rede e salvar novas inspeções. A navegação usa estado local e QR com fragmento `#station=...`, evitando buscar uma página por estação. Câmera requer permissão e contexto seguro. Todo aparelho precisa preparar seu próprio armazenamento.

Não limpe dados do navegador nem use modo anônimo com pendências. O armazenamento do navegador não substitui backup. Exporte cópia JSON na sincronização e CSV no histórico. Atualizações do app mantêm o banco IndexedDB. Em aparelhos compartilhados, a identificação deve ser conferida a cada inspeção.

## Limites do piloto / entrada em produção

- Acesso privado da plataforma para demonstração; nome/matrícula são declarados, não assinatura nem autenticação corporativa.
- Configurar com TI o acesso multiusuário, identidade corporativa, perfis de inspetor/qualidade/administração, política de retenção, backups e hospedagem definitiva antes do uso oficial.
- Validar os critérios transcritos das fotos, as unidades e os formulários controlados com a qualidade. Não há dados de produção ou estações fictícias pré-carregadas.
- O cadastro é imutável nesta versão; alterações de limites e correções com trilha de auditoria devem ser implementadas antes de expandir o piloto.
- Testar offline, reinstalação/atualização, câmera e sincronização nos celulares corporativos reais. Acesso HTTP por IP da rede não habilita PWA/câmera: utilizar HTTPS.
- Não há garantia de que a sessão privada da plataforma possa ser renovada offline. Preparação e acesso inicial exigem conexão.

## Verificação

```sh
npm run check
npm test
npm run build
```

`docs/VALIDACAO.md` registra os testes executados e as pendências. Não salvar credenciais no código ou expor a API do piloto fora do acesso privado sem autenticação.
