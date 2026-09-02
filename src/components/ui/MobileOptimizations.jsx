import { useEffect } from 'react';

export default function MobileOptimizations() {
  useEffect(() => {
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    // Enable momentum scrolling on iOS
    document.body.style.webkitOverflowScrolling = 'touch';

    // Pull-to-refresh é gerido exclusivamente por <PullToRefresh /> (Layout)
    // — o bloqueio do PTR nativo do browser acontece lá, sem listeners duplicados.

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  return null;
}