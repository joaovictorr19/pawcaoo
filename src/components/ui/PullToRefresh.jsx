import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PawPrint } from 'lucide-react';

// Única implementação de pull-to-refresh da app — usada exclusivamente pelo Layout.
const THRESHOLD = 70;
const MAX_PULL = 120;

// Evita que o gesto dispare por trás de modais/drawers ou dentro de scrollables próprios
const PTR_BLOCK_SELECTOR = '[role="dialog"], [data-radix-dialog-content], [data-radix-alert-dialog-content], [vaul-drawer], [data-vaul-drawer], textarea, input, select, [data-no-pull-refresh]';

export default function PullToRefresh({ children, onRefresh }) {
  const queryClient = useQueryClient();
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pulling, setPulling] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const loadingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const doRefresh = useCallback(async () => {
    if (loadingRef.current) return; // guarda contra refresh duplo
    loadingRef.current = true;
    isPullingRef.current = false;
    setPulling(false);
    setLoading(true);
    setDistance(50);
    try {
      // Apenas queries ativas — sem invalidação global pesada
      await queryClient.refetchQueries({ type: 'active' });
      if (onRefreshRef.current) await onRefreshRef.current();
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setDistance(0);
      currentDistanceRef.current = 0;
    }
  }, [queryClient]);

  useEffect(() => {
    const getScrollTop = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const handleTouchStart = (e) => {
      if (loadingRef.current || getScrollTop() > 0) return;
      // Não iniciar o gesto dentro de modais, drawers, campos de formulário
      if (e.target?.closest?.(PTR_BLOCK_SELECTOR)) return;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || loadingRef.current) return;
      if (getScrollTop() > 0) {
        isPullingRef.current = false;
        setPulling(false);
        setDistance(0);
        return;
      }
      const diffY = e.touches[0].clientY - startYRef.current;
      const diffX = Math.abs(e.touches[0].clientX - startXRef.current);
      // Conflito com scroll horizontal (ribbons, carrosséis) — aborta
      if (diffX > Math.abs(diffY)) {
        isPullingRef.current = false;
        setPulling(false);
        setDistance(0);
        return;
      }
      if (diffY > 0) {
        // Bloqueia o PTR nativo do browser (iOS Safari incluído)
        if (e.cancelable) e.preventDefault();
        const newDistance = Math.min(diffY * 0.4, MAX_PULL);
        currentDistanceRef.current = newDistance;
        setPulling(true);
        setDistance(newDistance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || loadingRef.current) {
        isPullingRef.current = false;
        setPulling(false);
        return;
      }
      if (currentDistanceRef.current >= THRESHOLD) {
        doRefresh();
      } else {
        setDistance(0);
        setPulling(false);
        currentDistanceRef.current = 0;
        isPullingRef.current = false;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [doRefresh]);

  const progress = Math.min(distance / THRESHOLD, 1);
  const reached = distance >= THRESHOLD;

  return (
    <div className="relative">
      {/* Indicador único — centrado sob o header móvel, respeitando a safe-area */}
      <div
        className="fixed left-1/2 z-[9999] pointer-events-none flex flex-col items-center"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
          opacity: distance > 6 || loading ? 1 : 0,
          transform: `translateX(-50%) translateY(${Math.min(distance, 56)}px) scale(${0.6 + progress * 0.4})`,
          transition: pulling
            ? 'opacity 0.15s'
            : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s',
        }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            background: reached
              ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
              : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: reached
              ? '2px solid #0d9488'
              : `2px solid rgba(13,148,136,${0.15 + progress * 0.3})`,
            boxShadow: reached
              ? '0 4px 20px rgba(13,148,136,0.35)'
              : '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {loading ? (
            <div className="ptr-spinner" style={{ width: 20, height: 20 }}>
              <PawPrint size={20} strokeWidth={2.5} style={{ color: '#ffffff' }} />
            </div>
          ) : (
            <PawPrint
              size={20}
              strokeWidth={2.5}
              style={{
                color: reached ? '#ffffff' : '#0d9488',
                transform: `rotate(${progress * 165}deg)`,
                transition: 'transform 0.2s ease-out, color 0.2s ease-out',
              }}
            />
          )}
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

      <style>{`
        .ptr-spinner {
          animation: ptr-spin 0.8s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Conteúdo */}
      <div
        style={{
          transform: `translateY(${distance * 0.3}px)`,
          transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}