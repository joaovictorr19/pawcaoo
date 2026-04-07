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
      // Fix any stuck backdrop overlays — do NOT remove() them as React owns the DOM
      const backdrops = document.querySelectorAll('[class*="backdrop"], [class*="overlay"]');
      backdrops.forEach(backdrop => {
        const zIndex = window.getComputedStyle(backdrop).zIndex;
        if (parseInt(zIndex) > 30 && backdrop.style.pointerEvents !== 'none') {
          console.warn('🧹 Removing stuck backdrop:', backdrop);
          backdrop.style.pointerEvents = 'none';
          backdrop.style.opacity = '0';
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
      console.log('🚪 Route changed, closing modal');
      onClose();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOpen, onClose]);
}