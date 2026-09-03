import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'dist/client';
async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? files(join(path, e.name)) : [join(path, e.name)],
      ),
    )
  ).flat();
}
const assets = (await files(root))
  .filter(
    (p) =>
      /\.(js|css|woff2?|svg|webmanifest|png)$/.test(p) &&
      !p.endsWith('sw.js') &&
      !p.endsWith('og.png'),
  )
  .map((p) => '/' + relative(root, p).replaceAll('\\', '/'));
const version = createHash('sha256')
  .update(JSON.stringify(assets))
  .digest('hex')
  .slice(0, 12);
const worker = `const CACHE='solda-${version}';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);const response=await fetch('/',{cache:'reload'});if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Não foi possível preparar a abertura offline.');await cache.put('/',response);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('solda-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/api/')||url.pathname.includes('__'))return;if(request.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(request,{cache:'no-store',signal:AbortSignal.timeout(2000)});if(response.ok)return response;}catch{}const shell=await(await caches.open(CACHE)).match('/');return shell||fetch(request);})());return;}if(ASSETS.includes(url.pathname))event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(url.pathname)||fetch(request);})());});`;
await writeFile(join(root, 'sw.js'), worker);
console.log(`Offline: ${assets.length} arquivos preparados (${version}).`);
