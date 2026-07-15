import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

export default function PortfolioLightbox({ items, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex || 0);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev]);

  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Previous */}
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-4xl max-h-[90vh] w-full px-12 flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {item.media_type === 'video' ? (
          <video
            src={item.media_url}
            className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
            controls
            autoPlay
          />
        ) : (
          <img
            src={item.media_url}
            alt={item.title || 'portfolio'}
            className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=800&h=600&fit=crop';
            }}
          />
        )}

        {/* Caption */}
        {(item.title || item.description || item.dog_name) && (
          <div className="mt-4 text-center text-white max-w-lg">
            {item.title && <p className="font-semibold text-sm">{item.title}</p>}
            {item.dog_name && <p className="text-xs text-white/60 mt-0.5">🐕 {item.dog_name}</p>}
            {item.description && <p className="text-xs text-white/70 mt-1">{item.description}</p>}
          </div>
        )}

        {/* Counter */}
        {items.length > 1 && (
          <p className="mt-3 text-xs text-white/40 font-medium">
            {index + 1} / {items.length}
          </p>
        )}
      </div>

      {/* Next */}
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              {it.media_type === 'video' ? (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4 text-white/70" />
                </div>
              ) : (
                <img src={it.media_url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}