const CACHE_NAME = 'al-anwar-english-institute-v2026-11-14-ux2';
const CORE = [
  './', './index.html', './manifest.webmanifest', './pwa.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './data/curriculum.js', './data/placement_test.js',
  ...['A1','A2','B1','B2','C1','C2','X1','X2','X3'].map(level => `./data/courses/${level}.js`)
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(CORE.map(async path => {
      const response = await fetch(path, {cache: 'reload'});
      if (!response.ok) throw new Error(`Offline asset unavailable (${response.status}): ${path}`);
      await cache.put(path, response);
    }));
    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length) {
      await caches.delete(CACHE_NAME);
      throw new Error(`Could not prepare offline mode: ${failed.length} core asset(s) failed.`);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('al-anwar-english-institute-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const acceptsHTML = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  if (acceptsHTML) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request, {ignoreSearch: true});
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});
