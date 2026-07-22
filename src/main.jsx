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