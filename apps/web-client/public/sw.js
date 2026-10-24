const CACHE_NAME = 'smartopd-clinical-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
];

// Install Event: Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline clinical shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first for dynamic routes and live state, with cache fallback
self.addEventListener('fetch', (event) => {
  // Pass WebSocket and non-GET requests directly
  if (event.request.method !== 'GET' || event.request.url.includes('/ws/')) {
    return;
  }

  // Next.js Turbopack dev server chunks / HMR pass-through
  if (event.request.url.includes('/_next/webpack-hmr') || event.request.url.includes('hot-update')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for static assets
        if (
          networkResponse.status === 200 &&
          (event.request.url.includes('/_next/static') || event.request.url.endsWith('.svg') || event.request.url.endsWith('.png'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // If network offline, serve from cache
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // Fallback for HTML navigations to root shell
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      })
  );
});

// Push Notification Listener (Emergency Triage / Cash Pilferage Audit)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 SmartOPD Clinical Alert';
  const options = {
    body: data.body || 'A high-priority clinical event requires immediate attention.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: data.url || '/',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
