import { useEffect, useState, useRef } from 'react';

export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [reduceMotion, setReduceMotion] = useState(() => 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const requestIdRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Disable heavy animations on mobile
  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
  }, [isMobile]);

  return { isMobile, reduceMotion };
}

// Cache imagens agressivamente em mobile
export function useImageCache() {
  useEffect(() => {
    if ('caches' in window) {
      caches.open('images-v1').then(cache => {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
          if (img.src) {
            cache.add(img.src).catch(() => {});
          }
        });
      });
    }
  }, []);
}