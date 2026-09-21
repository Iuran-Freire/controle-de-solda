# Manutenção do Controle de Solda

- Mantenha a interface em português do Brasil e os textos claros para inspetores.
- Mantenha o módulo de inspeção dividido em camadas dentro de `src`: interface em `presentation`, orquestração em `application`, regras puras em `domain` e integrações em `infrastructure`.
- A camada `domain` não deve importar React, navegador, Cloudflare ou bibliotecas de interface. A camada `presentation` pode depender de `application` e `domain`; `infrastructure` implementa persistência e serviços externos.
- Salve localmente antes de tentar enviar. Só marque como sincronizado após confirmação explícita do servidor para o mesmo ID e conteúdo.
- Nunca descarte registros pendentes, sobrescreva conflitos ou misture séries I-MR de estações diferentes.
- Preserve a hora da medição, a hora do lançamento, a data de produção e o snapshot dos limites.
- Não apresente identificação declarada como login autenticado. Não apresente estimativas I-MR como limites homologados.
- Valide entradas também no servidor, mantenha consultas parametrizadas e gere migrações via Drizzle.
- Use `npm run check`, `npm test` e `npm run build` após mudanças em persistência, regras ou sincronização.
- A versão de produção gera o service worker com os assets reais. O servidor de desenvolvimento não é a validação do offline.
- Não publique o piloto para acesso público sem autorização explícita.
