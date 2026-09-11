import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Cache module-level de URLs já carregadas nesta sessão.
// Ao remontar (ex: voltar atrás), imagens em cache aparecem de imediato
// sem o placeholder animate-pulse — elimina o efeito de "piscar".
const loadedUrlCache = new Set();

export default function OptimizedImage({
  src,
  alt,
  className,
  aspectRatio = 'square',
  priority = false,
  fallback = null
}) {
  const [isLoading, setIsLoading] = useState(() => !loadedUrlCache.has(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;
    if (loadedUrlCache.has(src)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
  }, [src]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]'
  };

  if (hasError || !src) {
    return fallback || (
      <div className={cn('bg-gray-200 flex items-center justify-center', aspectClasses[aspectRatio], className)}>
        <span className="text-gray-400 text-2xl">🐕</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          loadedUrlCache.add(src);
          setIsLoading(false);
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}