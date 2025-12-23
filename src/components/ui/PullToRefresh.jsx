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
    let touchStartY = 0;
    let isPulling = false;
    let currentDistance = 0;

    const handleTouchStart = (e) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop <= 5 && !loading) {
        touchStartY = e.touches[0].clientY;
        isPulling = true;
        setStartY(touchStartY);
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (!isPulling || scrollTop > 5 || loading) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;

      if (diff > 0 && diff < MAX_PULL) {
        currentDistance = Math.min(diff * 0.5, MAX_PULL);
        setDistance(currentDistance);
      } else if (diff <= 0) {
        currentDistance = 0;
        setDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || loading) {
        isPulling = false;
        setPulling(false);
        setDistance(0);
        return;
      }
      
      if (currentDistance > THRESHOLD) {
        setLoading(true);
        setDistance(THRESHOLD);
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.reload();
          }
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setLoading(false);
          setDistance(0);
          currentDistance = 0;
          isPulling = false;
          setPulling(false);
        }
      } else {
        setDistance(0);
        currentDistance = 0;
        isPulling = false;
        setPulling(false);
      }
    };

    const handleTouchCancel = () => {
      isPulling = false;
      currentDistance = 0;
      setPulling(false);
      setDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [loading, onRefresh]);

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