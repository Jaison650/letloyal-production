// LetLoyal Service Worker — push notifications + offline caching
const CACHE_NAME = 'letloyal-v1';
const OFFLINE_URL = '/offline';
const PRECACHE = ['/', '/my-rewards', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network-first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }
  // Cache-first for everything else, fall back to offline page
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ?? fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    )
  );
});

// Push notification support
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { title: 'LetLoyal', body: event.data?.text() ?? '' }; }

  const title = data.title ?? 'LetLoyal';
  const options = {
    body:    data.body   ?? '',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    tag:     data.tag    ?? 'letloyal',
    data:    { url: data.url ?? '/' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else self.clients.openWindow(url);
    })
  );
});
