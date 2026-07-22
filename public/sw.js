// LetLoyal Service Worker — push notifications + offline support
//
// CACHING STRATEGY (v2)
// ---------------------
// v1 was cache-first for *everything* except /api/, with a cache name that never
// changed. Precached HTML for '/' and '/my-rewards' was therefore served forever,
// so no deploy ever reached an existing visitor. Hence:
//
//   * navigations / HTML  -> network-first (cache and /offline only as fallback),
//                            so a deploy is live on the next online page load.
//   * /_next/static/*     -> cache-first. Next.js content-hashes these filenames,
//                            so a given URL's bytes never change and a new build
//                            produces new URLs. Safe and fast.
//   * other GETs          -> stale-while-revalidate: instant from cache, but the
//                            cache is refreshed in the background.
//   * /api/               -> network-only, never cached.
//
// Bump CACHE_VERSION on any change here; `activate` deletes every other cache,
// which is what finally purges a poisoned v1 cache from existing devices.
const CACHE_VERSION = 'v2';
const CACHE_NAME    = `letloyal-${CACHE_VERSION}`;
const OFFLINE_URL   = '/offline';
const PRECACHE      = [OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Cache-first — for immutable, content-hashed assets. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

/** Network-first — for HTML, so a deploy is picked up immediately. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? caches.match(OFFLINE_URL);
  }
}

/** Stale-while-revalidate — instant, but never permanently stale. */
async function staleWhileRevalidate(request) {
  const cached  = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await network) ?? caches.match(OFFLINE_URL);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Leave cross-origin traffic alone.
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // HTML / navigations — always try the network first.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Content-hashed build output is immutable.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
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
