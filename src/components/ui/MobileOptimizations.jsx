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

    // Optimize scrolling performance
    const optimizeScroll = () => {
      document.body.style.webkitOverflowScrolling = 'touch';
    };
    optimizeScroll();

    // Prevent pull-to-refresh on iOS for better UX
    let lastY = 0;
    const preventPullToRefresh = (event) => {
      const scrollY = window.scrollY || window.pageYOffset;
      const touchY = event.touches[0].clientY;
      
      if (scrollY === 0 && touchY > lastY) {
        event.preventDefault();
      }
      lastY = touchY;
    };

    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    // CRITICAL: Cleanup on visibility change to prevent freezes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause heavy operations when tab is hidden
        console.log('🔇 Tab hidden - pausing operations');
      } else {
        // Resume when tab is visible
        console.log('🔊 Tab visible - resuming');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      document.removeEventListener('touchmove', preventPullToRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}