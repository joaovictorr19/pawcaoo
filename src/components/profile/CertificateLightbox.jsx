import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, FileText, Download, ZoomIn, ZoomOut } from "lucide-react";

/**
 * CertificateLightbox — visualizador mobile-first para certificados.
 * PDFs: botão de abertura nativa (não usa iframe, que falha em mobile).
 * Imagens: dimensionamento correcto com max-h-full.
 */
export default function CertificateLightbox({ items, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const item = items[index];

  const next = useCallback(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setIndex(i => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
    setIndex(i => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, next, prev]);

  const handleDragStart = (e) => {
    if (!zoomed) return;
    e.stopPropagation();
    const t = e.touches?.[0] || e;
    dragging.current = true;
    dragStart.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
  };

  const handleDragMove = (e) => {
    if (!dragging.current || !zoomed) return;
    e.stopPropagation();
    const t = e.touches?.[0] || e;
    setPan({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };

  const handleDragEnd = () => { dragging.current = false; };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30 pointer-events-none">
        <span className="text-white/70 text-xs font-bold pointer-events-auto">
          {index + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          {!item.isPdf && (
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(z => !z); if (zoomed) setPan({ x: 0, y: 0 }); }}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
              title={zoomed ? "Reduzir" : "Ampliar"}
            >
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
            title="Descarregar"
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
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <div
        className="w-full h-full flex items-center justify-center px-3 pt-14 pb-16"
        onClick={(e) => e.stopPropagation()}
      >
        {item.isPdf ? (
          /* PDFs: botão de abertura nativa — funciona em todos os dispositivos */
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-white/70" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm font-bold text-white mb-1">{item.certName}</p>
              {item.certOrg && <p className="text-xs text-white/50">{item.certOrg}</p>}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 text-sm font-black hover:bg-white/90 active:scale-95 transition-all shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Abrir documento
            </a>
            <p className="text-[10px] text-white/40 max-w-[200px]">
              O documento abre no leitor nativo do seu dispositivo.
            </p>
          </div>
        ) : (
          /* Imagens: dimensionamento correcto */
          <div
            className={`w-full h-full flex items-center justify-center ${zoomed ? "overflow-hidden cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            onClick={() => !zoomed && setZoomed(true)}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            <img
              src={item.url}
              alt={item.certName}
              className="rounded-xl shadow-2xl select-none"
              style={{
                maxWidth: zoomed ? "none" : "calc(100vw - 1.5rem)",
                maxHeight: zoomed ? "none" : "calc(100vh - 7.5rem)",
                width: "auto",
                height: "auto",
                transform: zoomed
                  ? `scale(2) translate(${pan.x / 2}px, ${pan.y / 2}px)`
                  : "scale(1)",
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=800&h=600&fit=crop";
              }}
            />
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="absolute bottom-16 left-0 right-0 text-center px-4 pointer-events-none z-20">
        <p className="font-bold text-sm text-white drop-shadow-lg">{item.certName}</p>
        {item.certOrg && <p className="text-xs text-white/50 mt-0.5 drop-shadow">{item.certOrg}</p>}
      </div>

      {/* Next */}
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent overflow-x-auto z-20">
          {items.map((p, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setZoomed(false); setPan({ x: 0, y: 0 }); setIndex(i); }}
              className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all flex items-center justify-center bg-slate-800 ${
                i === index ? "border-white opacity-100 scale-105" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              {p.isPdf ? (
                <span className="text-[8px] font-black text-white/90 flex flex-col items-center gap-0.5">
                  <FileText className="w-3.5 h-3.5" />
                  PDF
                </span>
              ) : (
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}