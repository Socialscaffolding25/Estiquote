// ================================================================
// ESTIQUOTE — Service Worker
// Handles: Web Push notifications, offline caching
// ================================================================

const CACHE_NAME = 'estiquote-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/estimator.html',
  '/css/global.css',
  '/css/landing.css',
  '/js/auth.js',
  '/js/stripe-links.js',
  '/favicon.svg',
  '/manifest.json'
];

// ── INSTALL — cache core assets ───────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS).catch(err => {
        console.log('Cache addAll partial failure (ok):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE — clean old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH — network first, cache fallback ─────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests to same origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for HTML and assets
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback for HTML pages
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Estiquote', body: event.data.text(), url: '/' };
  }

  const options = {
    body: data.body || 'You have a new update',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'estiquote-notification',
    data: { url: data.url || '/dashboard.html' },
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Estiquote', options)
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('estiquote') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC (for offline enquiry saves) ───────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-enquiry') {
    event.waitUntil(syncPendingEnquiries());
  }
});

async function syncPendingEnquiries() {
  // Future: sync any enquiries saved while offline
  console.log('Background sync: checking pending enquiries');
}
