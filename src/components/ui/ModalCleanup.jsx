import { useEffect } from 'react';

/**
 * Global Modal Cleanup Hook
 * Prevents frozen modals and click-blocking overlays
 * 
 * Usage: Call this hook in Layout.js or main App component
 */
export function useModalCleanup() {
  useEffect(() => {
    const cleanup = () => {
      // Fix stuck overlays (only true full-screen overlays), avoid headers/toolbars
      const candidates = document.querySelectorAll('[class*="backdrop"], [data-radix-dialog-overlay], [data-radix-popover-overlay]');
      Array.from(candidates).forEach((el) => {
        const tag = el.tagName?.toLowerCase?.() || '';
        if (tag === 'header' || el.closest('header')) return;

        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const isFixed = style.position === 'fixed' || style.position === 'sticky';
        const coversViewport =
          rect.width >= window.innerWidth * 0.9 &&
          rect.height >= window.innerHeight * 0.9 &&
          rect.top <= 1 &&
          rect.left <= 1;

        const z = parseInt(style.zIndex || '0', 10);

        if (isFixed && coversViewport && z >= 30 && el.style.pointerEvents !== 'none') {
          console.warn('🧹 Disabling stuck overlay:', el);
          el.style.pointerEvents = 'none';
          el.style.opacity = '0';
        }
      });

      // Remove any stuck dialogs without proper close handlers
      const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      dialogs.forEach(dialog => {
        // Check if dialog is truly visible
        const isVisible = dialog.offsetParent !== null;
        const hasCloseButton = dialog.querySelector('[data-close]');
        
        if (isVisible && !hasCloseButton) {
          console.warn('🧹 Found dialog without close handler:', dialog);
        }
      });

      // Reset body scroll lock if stuck
      if (document.body.style.overflow === 'hidden' && 
          !document.querySelector('[role="dialog"][data-state="open"]')) {
        console.warn('🧹 Resetting stuck body overflow');
        document.body.style.overflow = '';
      }
    };

    // Run cleanup on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(cleanup, 100);
      }
    };

    // Run cleanup on route change
    const handleRouteChange = () => {
      setTimeout(cleanup, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleRouteChange);

    // Initial cleanup
    cleanup();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}

/**
 * Hook to auto-close modals on route change
 */
export function useCloseOnRouteChange(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    const handleRouteChange = () => {
      onClose();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOpen, onClose]);
}