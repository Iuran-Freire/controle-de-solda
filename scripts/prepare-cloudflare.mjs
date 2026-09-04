import { readFile, writeFile } from 'node:fs/promises';

// Reuse the validated Vinext output without changing the Sites deployment.
// Account/database IDs are configuration, never authentication credentials.
const [accountId, databaseId] = process.argv.slice(2);
if (!/^[a-f0-9]{32}$/i.test(accountId ?? '') ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(databaseId ?? '') ||
    databaseId === '00000000-0000-4000-8000-000000000000') {
  throw new Error('Informe o ID da conta Cloudflare e o ID real do banco D1.');
}
const built = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
const config = {
  name: 'controle-solda',
  account_id: accountId,
  main: 'dist/server/index.js',
  compatibility_date: built.compatibility_date,
  compatibility_flags: built.compatibility_flags,
  no_bundle: true,
  rules: built.rules,
  assets: { directory: 'dist/client' },
  keep_vars: true,
  // Access is managed separately in the account; do not create preview URLs.
  workers_dev: true,
  preview_urls: false,
  d1_databases: [{
    binding: 'DB',
    database_name: 'controle-solda-db',
    database_id: databaseId,
    migrations_dir: 'drizzle',
  }],
};
await writeFile('wrangler.cloudflare.json', JSON.stringify(config, null, 2) + '\n');
console.log('Configuração preparada para o Worker controle-solda.');
