import React, { useEffect, useRef, useState } from 'react';

export default function LazyLoadWrapper({ children, threshold = 0.1, rootMargin = '50px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef}>
      {isVisible ? children : <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />}
    </div>
  );
}