import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, PlayCircle, Download, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

/**
 * MediaLightbox — visualizador mobile-first para fotos e vídeos (portefólios).
 * Imagens: pinch-to-zoom, duplo toque/click para ampliar, arrastar quando ampliado
 * e swipe horizontal para navegar. Vídeos: leitor nativo com controlos.
 * Renderiza via React Portal no body para evitar o ecrã preto em mobile quando
 * a árvore de pais tem transform/filter (animações), que quebram o posicionamento fixo.
 *
 * Items: { url | media_url, media_type?: 'video', title?, caption?, description?, dog_name? }
 */
export default function MediaLightbox({ items, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gesturing, setGesturing] = useState(false);

  const item = items[index];
  const url = item?.url || item?.media_url;
  const isVideo = item?.media_type === "video";

  const gesture = useRef(null);
  const lastTap = useRef(0);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setLoaded(false);
    setFailed(false);
  }, []);

  const next = useCallback(() => {
    resetView();
    setIndex(i => (i + 1) % items.length);
  }, [items.length, resetView]);

  const prev = useCallback(() => {
    resetView();
    setIndex(i => (i - 1 + items.length) % items.length);
  }, [items.length, resetView]);

  const clampPan = useCallback((p, s) => {
    if (s <= 1) return { x: 0, y: 0 };
    const maxX = Math.max(0, (window.innerWidth * (s - 1)) / 2);
    const maxY = Math.max(0, (window.innerHeight * (s - 1)) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, p.x)),
      y: Math.min(maxY, Math.max(-maxY, p.y)),
    };
  }, []);

  const zoomBy = useCallback((factor) => {
    const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    setScale(ns);
    setPan(ns <= 1 ? { x: 0, y: 0 } : p => clampPan(p, ns));
  }, [scale, clampPan]);

  const toggleZoom = useCallback(() => {
    if (scale > 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  }, [scale]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (!isVideo && (e.key === "+" || e.key === "=")) zoomBy(1.5);
      if (!isVideo && (e.key === "-" || e.key === "_")) zoomBy(1 / 1.5);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, next, prev, zoomBy, isVideo]);

  /* ── Toque (mobile): pinch, arrastar, swipe e duplo toque ── */
  const touchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    if (isVideo) return;
    setGesturing(true);
    const touches = e.touches;
    if (touches.length === 2) {
      gesture.current = { type: "pinch", startDist: touchDist(touches), startScale: scale, startPan: pan };
    } else if (touches.length === 1) {
      const t = touches[0];
      gesture.current = {
        type: scale > 1 ? "pan" : "swipe",
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
        startPan: pan,
        moved: false,
      };
    }
  };

  const onTouchMove = (e) => {
    if (isVideo || !gesture.current) return;
    const g = gesture.current;
    const touches = e.touches;
    if (g.type === "pinch" && touches.length === 2) {
      e.preventDefault();
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.startScale * (touchDist(touches) / g.startDist)));
      setScale(ns);
      setPan(ns <= 1 ? { x: 0, y: 0 } : clampPan(g.startPan, ns));
    } else if (touches.length === 1 && g.type === "pan") {
      e.preventDefault();
      const t = touches[0];
      setPan(clampPan({ x: g.startPan.x + (t.clientX - g.startX), y: g.startPan.y + (t.clientY - g.startY) }, scale));
    }
  };

  const onTouchEnd = (e) => {
    if (isVideo || !gesture.current) return;
    const g = gesture.current;
    gesture.current = null;
    setGesturing(false);

    if (g.type === "pinch") {
      if (scale < 1.15) {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
      return;
    }

    const endX = e.changedTouches?.[0]?.clientX ?? g.startX;
    const dx = endX - g.startX;
    const elapsed = Date.now() - g.startTime;

    if (!g.moved) {
      // toque simples vs duplo toque (zoom)
      const now = Date.now();
      if (now - lastTap.current < 300) {
        toggleZoom();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
      return;
    }

    // swipe horizontal para navegar entre fotos
    if (elapsed < 400 && Math.abs(dx) > 60) {
      if (dx < 0) next();
      else prev();
    }
  };

  /* ── Rato (desktop): arrastar quando ampliado ── */
  const onMouseDown = (e) => {
    if (isVideo || scale <= 1) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPan(clampPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }, scale));
  };
  const onMouseUp = () => { dragging.current = false; };

  if (!item) return null;

  const captionTitle = item.title || item.caption;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30 pointer-events-none"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <span className="text-white/70 text-xs font-bold pointer-events-auto">
          {index + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isVideo && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); zoomBy(1.5); }}
                disabled={scale >= MAX_SCALE}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center disabled:opacity-30"
                title="Ampliar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); zoomBy(1 / 1.5); }}
                disabled={scale <= MIN_SCALE}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center disabled:opacity-30"
                title="Reduzir"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
            title="Abrir em nova aba"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {items.length > 1 && (isVideo || scale <= 1) && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <div
        className="w-full h-full flex items-center justify-center px-3 pt-14 pb-16 box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          /* Vídeos: leitor nativo com controlos */
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="rounded-xl shadow-2xl bg-black"
            style={{
              maxWidth: "calc(100vw - 1.5rem)",
              maxHeight: "calc(100vh - 9rem)",
            }}
          />
        ) : (
          /* Imagens: zoom por pinch, duplo toque, arrastar e swipe */
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={toggleZoom}
          >
            {!loaded && !failed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
              </div>
            )}
            {failed ? (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <p className="text-sm font-bold text-white/80">Não foi possível carregar a imagem</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-black active:scale-95 transition-all"
                >
                  Abrir em nova aba
                </a>
              </div>
            ) : (
              <img
                src={url}
                alt={captionTitle || "foto"}
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={`object-contain rounded-xl shadow-2xl select-none transition-opacity duration-200 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  // Tamanhos relativos ao ecrã (independentes da árvore de pais)
                  maxWidth: "calc(100vw - 1.5rem)",
                  maxHeight: "calc(100vh - 9rem)",
                  width: "auto",
                  height: "auto",
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                  transition: gesturing ? "none" : "transform 0.18s ease-out",
                  cursor: scale > 1 ? "grab" : "zoom-in",
                }}
                draggable={false}
              />
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {scale <= 1 && (captionTitle || item.description || item.dog_name) && (
        <div className="absolute bottom-16 left-0 right-0 text-center px-4 pointer-events-none z-20">
          {captionTitle && <p className="font-bold text-sm text-white drop-shadow-lg">{captionTitle}</p>}
          {item.dog_name && <p className="text-xs text-white/60 mt-0.5 drop-shadow">🐕 {item.dog_name}</p>}
          {item.description && <p className="text-xs text-white/70 mt-1 drop-shadow max-w-lg mx-auto">{item.description}</p>}
        </div>
      )}

      {/* Next */}
      {items.length > 1 && (isVideo || scale <= 1) && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Thumbnails */}
      {items.length > 1 && (isVideo || scale <= 1) && (
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent overflow-x-auto z-20"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {items.map((p, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); resetView(); setIndex(i); }}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all flex items-center justify-center bg-slate-800 ${
                i === index ? "border-white opacity-100 scale-105" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              {p.media_type === "video" ? (
                <PlayCircle className="w-5 h-5 text-white/80" />
              ) : (
                <img src={p.url || p.media_url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}