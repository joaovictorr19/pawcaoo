import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

export default function PullToRefresh({ children, onRefresh }) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);
  
  const THRESHOLD = 80; // Distance to trigger refresh
  const MAX_PULL = 160; // Maximum drag distance

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Only activate if at the top of the page
    const handleTouchStart = (e) => {
      if (window.scrollY <= 5) { // Allow a small margin
        setStartY(e.touches[0].clientY);
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling || window.scrollY > 5 || loading) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        // If pulling down
        if (e.cancelable && diff < MAX_PULL) {
           // Optional: e.preventDefault(); to stop native scroll if implemented at body level, 
           // but tricky inside components.
        }
        
        // Apply resistance
        const newDist = Math.min(diff * 0.5, MAX_PULL);
        setDistance(newDist);
      } else {
        setDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling || loading) return;
      
      if (distance > THRESHOLD) {
        setLoading(true);
        setDistance(THRESHOLD); // Keep spinner visible
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Simulate network delay then reload for smoothness
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.reload();
          }
        } finally {
          setLoading(false);
          setDistance(0);
        }
      } else {
        setDistance(0);
      }
      setPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pulling, distance, loading, onRefresh]);

  return (
    <div ref={contentRef} className="min-h-screen relative">
      {/* Refresh Indicator */}
      <div 
        className="fixed left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{ 
          top: '80px', // Below header
          transform: `translateY(${distance > 0 ? distance - 60 : -100}px)`,
          opacity: distance > 0 ? 1 : 0,
          transition: pulling ? 'none' : 'all 0.3s ease-out'
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-xl border border-gray-100 flex items-center justify-center w-10 h-10">
          {loading ? (
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
          ) : (
            <ArrowDown 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${distance > THRESHOLD ? 'rotate-180 text-green-600' : ''}`} 
            />
          )}
        </div>
      </div>

      {/* Content Container */}
      <div 
        style={{ 
          transform: `translateY(${distance}px)`,
          transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}