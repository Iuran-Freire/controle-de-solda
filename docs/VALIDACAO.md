# Validação do piloto

Data: 02/09/2026.

- TypeScript: compilação de tipos aprovada.
- Testes automatizados: 6 cenários aprovados, cobrindo limites inclusivos, não conformidades, data futura, cálculo MR, duplicidade local concorrente e persistência/sincronização após falha de rede, ACK incompleto e conflito.
- API local/D1: cadastro, persistência, reenvio idempotente, bloqueio de duplicidade, imutabilidade por ID, validação de NC e rejeição de origem externa aprovados. Fixtures removidas do banco local após os testes.
- Offline: teste do service worker gerado com assets reais da compilação. Instalou 13 arquivos, abriu a página e carregou JavaScript com rede simulada indisponível; requisições à API não são interceptadas pelo cache.
- Build Worker + cliente + manifesto offline concluído.
- Versão compilada conectada ao banco local com `--persist-to .wrangler/state`; consulta à API retornou HTTP 200.
- Lint da aplicação concluído sem erros; permanecem dois avisos consultivos de React Compiler no hook de inicialização.
- Migração inicial gerada pelo Drizzle, inspecionada e aplicada ao D1 local.
- Auditoria de dependências: corrigidos os alertas altos do scaffold (React, Vinext, Vite e runtime Cloudflare). Permanecem 4 alertas moderados na cadeia de ferramentas do Drizzle; não foi aplicada regressão de versão sugerida pelo audit.
- Lint considera o código da aplicação; componentes shadcn gerados e hook gerado estão excluídos. Regra React Compiler é consultiva porque o projeto não usa esse compilador.

## Pendências de homologação

Atualização — resultados por dia e turno: 10 testes aprovados no total. Foram adicionados cenários de agrupamento pela data de produção (inclusive medição no dia civil seguinte), separação por turno/posto, exclusão de conflitos, identificação de pendências, intervalo vazio e preservação de valores individuais/limites históricos. TypeScript e build aprovados.

Não foi realizada inspeção visual automatizada nem teste em celular físico. Câmera, permissões, instalação PWA, armazenamento sob pressão, atualização de versões e retomada após expiração de sessão devem ser testados nos aparelhos corporativos. O teste do worker simula a rede em um ambiente de execução JavaScript; não substitui teste de navegador real.

WebMCP opcional `start_station_inspection` foi implementado com detecção de suporte; não havia contexto WebMCP de validação disponível nesta execução. Não foi considerado um recurso homologado.

Login corporativo, permissões por função, assinatura autenticada, correções com auditoria e política de backup/retencão ainda precisam da integração com a TI. A identificação atual é declarada. O piloto não deve ser liberado publicamente.

Critérios e unidades transcritos das fotos precisam da confirmação da qualidade. As cartas I-MR usam limites estimados, não uma linha de base homologada.

## Entrega local e publicação

O projeto foi aberto no VS Code e a versão local ficou disponível em http://localhost:3000. A primeira tentativa de publicação foi bloqueada pela revisão automática. Após autorização explícita do usuário para enviar o código ao repositório privado Sites e hospedar com acesso restrito à sua conta, a versão 1 foi publicada em https://inventus-controle-solda.efdvdf.chatgpt.site em 02/09/2026.

As verificações HTTP autenticadas retornaram 200 para a página, manifest, service worker e API de postos; a API sem autenticação retornou 401. O teste local do worker validou 14 assets reais e a abertura simulada sem rede. Não houve teste em Android físico. O acesso continua restrito ao proprietário; os convites externos estão indisponíveis nesta conta. Registros locais de inspeção não foram transferidos para a base hospedada.
