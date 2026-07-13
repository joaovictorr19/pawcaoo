import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Single source of truth for scroll-to-top on navigation.
// useLayoutEffect runs before paint (no flash), scrollRestoration='manual'
// prevents browser auto-restore, and document.scrollingElement covers iOS Safari.
if (typeof window !== "undefined" && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    const resetScroll = () => {
      // document.scrollingElement is the reliable cross-browser target (includes iOS)
      const el = document.scrollingElement || document.documentElement;
      if (el) {
        el.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
    };

    resetScroll();
    // Fallback for dynamically loaded content (images, async data)
    const rafId = requestAnimationFrame(resetScroll);
    const timeoutId = window.setTimeout(resetScroll, 100);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}