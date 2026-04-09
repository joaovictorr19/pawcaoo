import React, { useState, useEffect, useRef } from 'react';

export default function LazyImage({ src, alt, className = '', containerClassName = '', onLoad }) {
  const [loaded, setLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
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
          onLoad={() => {
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