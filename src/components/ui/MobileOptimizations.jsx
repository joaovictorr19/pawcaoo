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

    // Only prevent pull-to-refresh on iOS Safari
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isWebKit = /AppleWebKit/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    const shouldPreventPTR = isIOS && isWebKit;

    let startY = 0;
    const onTouchStart = (event) => {
      if (!shouldPreventPTR) return;
      startY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event) => {
      if (!shouldPreventPTR) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      const dy = currentY - startY;
      // At top and pulling down => prevent browser PTR
      if ((window.scrollY || window.pageYOffset) <= 0 && dy > 10) {
        event.preventDefault();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return null;
}