import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    // Registra SW estático para evitar problemas com blob: em navegadores/preview
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
      })
      .catch((error) => {
        console.warn('Service Worker indisponível neste ambiente:', error?.message || error);
      });
  }, []);

  return null;
}