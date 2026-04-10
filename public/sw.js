// Basic Service Worker for notifications and offline-ready hooks
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'PawCão';
  const options = {
    body: data.body || data.message || 'Nova notificação',
    icon: data.icon || '/logo.png',
    badge: '/favicon.png',
    tag: data.tag || 'notification',
    data: data.data || {},
    requireInteraction: !!data.requireInteraction,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (urlToOpen && urlToOpen !== '/' && 'navigate' in client) {
            return client.navigate(urlToOpen);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});