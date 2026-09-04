import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Patch ResizeObserver to prevent "loop completed with undelivered notifications" errors.
// This must run before any component creates a ResizeObserver. The error is a benign
// browser quirk; we break the synchronous layout loop by deferring the callback.
if (typeof window !== 'undefined' && !window.__resizeObserverPatched) {
  window.__resizeObserverPatched = true;
  const Native = window.ResizeObserver;
  if (Native) {
    window.ResizeObserver = class extends Native {
      observe(target, options) {
        requestAnimationFrame(() => {
          try { super.observe(target, options); } catch (_) {}
        });
      }
    };
  }
}

// Auto-recuperação para falhas de importação de módulos.
// Após novos deploys (ou PWA com service worker antigo), o browser pode tentar
// carregar "chunks" de versões anteriores que já não existem no servidor,
// causando "Importing a module script failed" / "Failed to fetch dynamically
// imported module". Nesses casos limpamos as caches e recarregamos uma única vez.
if (typeof window !== 'undefined' && !window.__moduleImportRecoveryPatched) {
  window.__moduleImportRecoveryPatched = true;
  const STALE_CHUNK_PATTERNS = [
    'Importing a module script failed',
    'Failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'Unable to load script',
  ];
  const isStaleChunkError = (message) =>
    STALE_CHUNK_PATTERNS.some(p => String(message || '').includes(p));

  const recoverFromStaleChunk = () => {
    try {
      if (sessionStorage.getItem('__staleChunkReload')) return; // já recarregamos uma vez — não fazer loop
      sessionStorage.setItem('__staleChunkReload', '1');
      if (window.caches?.keys) {
        window.caches.keys().then(keys => keys.forEach(k => window.caches.delete(k))).catch(() => {});
      }
      window.location.reload();
    } catch (_) {}
  };

  window.addEventListener('error', (e) => {
    if (isStaleChunkError(e?.message) || isStaleChunkError(e?.error?.message)) recoverFromStaleChunk();
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e?.reason?.message || e?.reason;
    if (isStaleChunkError(msg)) recoverFromStaleChunk();
  });
  // Limpar a flag ao navegar normalmente para que futuros deploys também se recuperem
  window.addEventListener('popstate', () => {
    try { sessionStorage.removeItem('__staleChunkReload'); } catch (_) {}
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}