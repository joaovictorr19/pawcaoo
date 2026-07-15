import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PawPrint } from 'lucide-react';

export default function PullToRefresh({ children, onRefresh }) {
  const queryClient = useQueryClient();
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentDistanceRef = useRef(0);
  const isPullingRef = useRef(false);

  const THRESHOLD = 70;
  const MAX_PULL = 120;

  const doRefresh = useCallback(async () => {
    setLoading(true);
    setDistance(50);
    try {
      await queryClient.invalidateQueries();
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setLoading(false);
      setDistance(0);
      currentDistanceRef.current = 0;
      isPullingRef.current = false;
    }
  }, [onRefresh, queryClient]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 0 && !loading) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || loading) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 0) {
        isPullingRef.current = false;
        setDistance(0);
        return;
      }
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = Math.abs(currentX - startXRef.current);
      if (diffX > Math.abs(diffY)) {
        isPullingRef.current = false;
        setDistance(0);
        return;
      }
      if (diffY > 0) {
        e.preventDefault();
        const newDistance = Math.min(diffY * 0.4, MAX_PULL);
        currentDistanceRef.current = newDistance;
        setDistance(newDistance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || loading) {
        isPullingRef.current = false;
        return;
      }
      if (currentDistanceRef.current >= THRESHOLD) {
        doRefresh();
      } else {
        setDistance(0);
        currentDistanceRef.current = 0;
        isPullingRef.current = false;
      }
    };

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
  const reached = distance >= THRESHOLD;

  return (
    <div ref={containerRef} className="relative">
      {/* PawCão Refresh Indicator */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center"
        style={{
          top: '52px',
          opacity: distance > 6 || loading ? 1 : 0,
          transform: `translateY(${Math.min(distance, 56)}px) scale(${0.6 + progress * 0.4})`,
          transition: isPullingRef.current
            ? 'opacity 0.15s'
            : 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div
          className="rounded-full flex items-center justify-center shadow-lg"
          style={{
            width: '40px',
            height: '40px',
            background: reached ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'rgba(255,255,255,0.95)',
            border: reached
              ? '2px solid #0d9488'
              : `2px solid rgba(13,148,136,${0.15 + progress * 0.3})`,
            boxShadow: reached
              ? '0 4px 20px rgba(13,148,136,0.35)'
              : '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <PawPrint
            size={20}
            strokeWidth={2.5}
            style={{
              color: reached ? '#ffffff' : '#0d9488',
              transform: loading ? 'rotate(360deg)' : `rotate(${progress * 165}deg)`,
              transition: loading
                ? 'transform 0.8s linear infinite'
                : 'transform 0.2s ease-out, color 0.2s ease-out',
            }}
          />
        </div>
        {distance > 28 && !loading && (
          <span
            className="text-[10px] font-bold mt-1.5 whitespace-nowrap"
            style={{ color: reached ? '#0d9488' : '#94a3b8' }}
          >
            {reached ? 'Solte para atualizar' : 'Puxe para atualizar'}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${distance * 0.3}px)`,
          transition: isPullingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}