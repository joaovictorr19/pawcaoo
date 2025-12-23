import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Service Worker code inline (workaround para não poder criar public/sw.js)
      const swCode = `
        // Service Worker para Push Notifications - iOS e Android
        self.addEventListener('install', (event) => {
          console.log('✅ Service Worker instalado');
          self.skipWaiting();
        });

        self.addEventListener('activate', (event) => {
          console.log('✅ Service Worker ativado');
          event.waitUntil(clients.claim());
        });

        // Receber push notifications mesmo com app fechado
        self.addEventListener('push', (event) => {
          console.log('📬 Push notification recebida:', event);

          let data = {
            title: 'PawCão',
            body: 'Nova notificação',
            icon: '/logo.png',
            badge: '/favicon.png',
            tag: 'default',
            requireInteraction: false,
          };

          try {
            if (event.data) {
              const payload = event.data.json();
              data = {
                title: payload.title || 'PawCão',
                body: payload.body || payload.message || 'Nova notificação',
                icon: payload.icon || '/logo.png',
                badge: '/favicon.png',
                tag: payload.tag || 'notification',
                requireInteraction: payload.requireInteraction || false,
                data: payload.data || {},
                vibrate: [200, 100, 200],
                actions: payload.actions || []
              };
            }
          } catch (error) {
            console.error('Erro ao processar push:', error);
          }

          event.waitUntil(
            self.registration.showNotification(data.title, {
              body: data.body,
              icon: data.icon,
              badge: data.badge,
              tag: data.tag,
              requireInteraction: data.requireInteraction,
              data: data.data,
              vibrate: data.vibrate,
              actions: data.actions
            })
          );
        });

        // Abrir app quando clicar na notificação
        self.addEventListener('notificationclick', (event) => {
          console.log('🖱️ Notificação clicada:', event);

          event.notification.close();

          const urlToOpen = event.notification.data?.url || '/';

          event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
              // Se o app já estiver aberto, focar nele
              for (let client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                  return client.focus().then(() => {
                    if (urlToOpen !== '/') {
                      return client.navigate(urlToOpen);
                    }
                  });
                }
              }
              // Se não estiver aberto, abrir nova janela
              if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
              }
            })
          );
        });
      `;

      // Criar blob com o código do Service Worker
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      // Registrar Service Worker
      navigator.serviceWorker
        .register(swUrl, { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });

      // Cleanup
      return () => {
        URL.revokeObjectURL(swUrl);
      };
    }
  }, []);

  return null;
}