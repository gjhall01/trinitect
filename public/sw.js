// Trinitect service worker — minimal shell for PWA install + future push
const CACHE_NAME = 'trinitect-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Handle push events (for future web push implementation)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Trinitect';
  const options = {
    body: data.body || "Your patterns are waiting.",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'trinitect-daily',
    renotify: true,
    data: { url: data.url || '/today' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/today';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
