import React, { useState, useEffect, useRef } from 'react';

// Cache module-level de URLs já carregadas nesta sessão.
// Ao remontar, imagens em cache são apresentadas de imediato (sem observer
// e sem placeholder pulsante) — elimina o "piscar" ao voltar atrás.
const loadedUrlCache = new Set();

export default function LazyImage({ src, alt, className = '', containerClassName = '', onLoad }) {
  const alreadyLoaded = loadedUrlCache.has(src);
  const [loaded, setLoaded] = useState(alreadyLoaded);
  const [imageSrc, setImageSrc] = useState(alreadyLoaded ? src : null);
  const ref = useRef(null);

  useEffect(() => {
    // Já em cache: mostrar de imediato, sem IntersectionObserver.
    if (loadedUrlCache.has(src)) {
      setImageSrc(src);
      setLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [src]);

  return (
    <div ref={ref} className={containerClassName}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          decoding="async"
          onLoad={() => {
            loadedUrlCache.add(src);
            setLoaded(true);
            onLoad?.();
          }}
          loading="lazy"
        />
      ) : (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      )}
    </div>
  );
}