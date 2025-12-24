import React, { useState, useEffect } from 'react';

export default function ImageOptimizer({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  priority = false 
}) {
  const [imageSrc, setImageSrc] = useState(priority ? src : null);
  const [isLoading, setIsLoading] = useState(!priority);

  useEffect(() => {
    if (priority) return; // Skip lazy load for priority images

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
  }, [src, priority]);

  // Optimize image URL (add compression params if using Supabase)
  const optimizedSrc = imageSrc && imageSrc.includes('supabase.co')
    ? `${imageSrc}?width=${width || 800}&quality=85`
    : imageSrc;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={width}
          height={height}
        />
      )}
    </div>
  );
}