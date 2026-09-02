import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const origin = 'http://127.0.0.1:3000';
const handlers = {},
  store = new Map();
let network = true,
  requests = 0;
const cache = {
  async addAll(urls) {
    for (const url of urls) {
      const r = await fetch(origin + url);
      assert.equal(r.status, 200, `Asset ${url}`);
      store.set(url, r);
    }
  },
  async put(key, response) {
    store.set(key, response);
  },
  async match(key) {
    return store.get(key)?.clone();
  },
};
const context = {
  self: {
    addEventListener: (type, handler) => (handlers[type] = handler),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  },
  caches: {
    open: async () => cache,
    keys: async () => ['solda-previous'],
    delete: async () => true,
  },
  URL,
  location: { origin },
  fetch: async (path, init) => {
    requests++;
    if (!network) throw new Error('offline');
    return fetch(new URL(path, origin), init);
  },
};
vm.runInNewContext(await readFile('dist/client/sw.js', 'utf8'), context);
let ready = Promise.resolve();
handlers.install({ waitUntil: (promise) => (ready = promise) });
await ready;
assert.ok(store.has('/'));
network = false;
let response = Promise.resolve(new Response());
handlers.fetch({
  request: { method: 'GET', url: origin + '/', mode: 'navigate' },
  respondWith: (promise) => (response = promise),
});
assert.equal((await response).status, 200);
const before = requests;
const asset = [...store.keys()].find((k) => k.endsWith('.js'));
handlers.fetch({
  request: { method: 'GET', url: origin + asset, mode: 'cors' },
  respondWith: (promise) => (response = promise),
});
assert.equal((await response).status, 200);
assert.equal(requests, before);
let intercepted = false;
handlers.fetch({
  request: { method: 'GET', url: origin + '/api/sync', mode: 'cors' },
  respondWith: () => (intercepted = true),
});
assert.equal(intercepted, false);
console.log(
  `Offline: ${store.size - 1} assets reais carregados; abertura e JavaScript servidos sem rede; API não é cacheada.`,
);
