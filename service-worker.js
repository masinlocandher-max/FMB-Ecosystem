// Emergency cache reset for the Cloudflare-hosted site.
// The previous service worker could keep serving old HTML and broken image paths.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'FMB_CACHE_PURGED' });
    }
    await self.registration.unregister();
  })());
});

self.addEventListener('fetch', () => {
  // Intentionally do not intercept requests. Every page and image must come
  // from the current Cloudflare deployment while the stale cache is cleared.
});
