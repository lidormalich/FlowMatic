const CACHE_NAME = 'flowmatic-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/FlowMatic.png',
  '/manifest.json',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first for API, stale-while-revalidate for static
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle http/https — ignore chrome-extension://, data:, etc.
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // API calls - network only, absorb failures gracefully
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('Network error', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }))
    );
    return;
  }

  // Static assets - stale while revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => cached || new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }));

      return cached || fetchPromise;
    })
  );
});
