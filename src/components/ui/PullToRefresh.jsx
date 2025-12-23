import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function PullToRefresh({ children, onRefresh }) {
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const currentDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  
  const THRESHOLD = 70;
  const MAX_PULL = 120;

  const doRefresh = useCallback(async () => {
    setLoading(true);
    setDistance(50);
    
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Force page reload
        await new Promise(resolve => setTimeout(resolve, 300));
        window.location.reload();
      }
    } catch (error) {
      console.error('Refresh error:', error);
      // Still reload on error
      window.location.reload();
    } finally {
      setLoading(false);
      setDistance(0);
      currentDistanceRef.current = 0;
      isPullingRef.current = false;
      setPulling(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      // Check if we're at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      
      if (scrollTop <= 0 && !loading) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || loading) return;
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 0) {
        isPullingRef.current = false;
        setPulling(false);
        setDistance(0);
        return;
      }
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Prevent default scroll when pulling down
        e.preventDefault();
        const newDistance = Math.min(diff * 0.4, MAX_PULL);
        currentDistanceRef.current = newDistance;
        setDistance(newDistance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || loading) {
        isPullingRef.current = false;
        setPulling(false);
        return;
      }
      
      if (currentDistanceRef.current >= THRESHOLD) {
        doRefresh();
      } else {
        setDistance(0);
        currentDistanceRef.current = 0;
        isPullingRef.current = false;
        setPulling(false);
      }
    };

    // Use container for events, not document
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [loading, doRefresh]);

  const progress = Math.min(distance / THRESHOLD, 1);

  return (
    <div ref={containerRef} className="min-h-screen relative touch-pan-y">
      {/* Refresh Indicator */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        style={{ 
          top: '70px',
          opacity: distance > 10 ? 1 : 0,
          transform: `translateY(${Math.min(distance, 60)}px)`,
          transition: pulling ? 'opacity 0.1s' : 'all 0.3s ease-out'
        }}
      >
        <div 
          className={`bg-white rounded-full p-3 shadow-2xl border-2 flex items-center justify-center w-12 h-12 ${
            distance >= THRESHOLD ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
          ) : (
            <RefreshCw 
              className={`w-6 h-6 transition-all duration-200 ${
                distance >= THRESHOLD ? 'text-green-600' : 'text-gray-400'
              }`}
              style={{ 
                transform: `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
        {distance > 20 && !loading && (
          <p className="text-xs text-center mt-1 text-gray-500 font-medium">
            {distance >= THRESHOLD ? 'Soltar para atualizar' : 'Puxar para atualizar'}
          </p>
        )}
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${distance * 0.3}px)`,
          transition: pulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}