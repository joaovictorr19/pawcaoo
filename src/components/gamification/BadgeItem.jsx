import React from 'react';
import { Award, Pin } from 'lucide-react';

const RARITY_RING = {
  legendary: 'ring-2 ring-amber-400/70 shadow-amber-200/40',
  epic:      'ring-2 ring-purple-400/70 shadow-purple-200/40',
  rare:      'ring-2 ring-sky-400/70 shadow-sky-200/40',
  common:    'ring-1 ring-slate-200 shadow-slate-100',
};

const RARITY_DOT = {
  legendary: 'bg-amber-400',
  epic:      'bg-purple-400',
  rare:      'bg-sky-400',
  common:    'bg-slate-300',
};

export default function BadgeItem({ badge, isPinned, onPin, isOwner, isEarned, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16 md:w-20 md:h-20';
  const imgClass  = size === 'sm' ? 'w-8 h-8'  : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10 md:w-14 md:h-14';

  const rarity = badge.rarity || 'common';
  const imageUrl = badge.image_png_file || badge.image_url;

  return (
    <div className={`relative ${sizeClass} rounded-2xl flex items-center justify-center overflow-hidden group cursor-default backdrop-blur-xl bg-sky-50/80 border border-white/50 shadow-md ${RARITY_RING[rarity]} ${!isEarned ? 'opacity-40 grayscale' : ''}`}>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={badge.name}
          className={`${imgClass} object-contain drop-shadow-lg z-10 p-1`}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : badge.icon ? (
        <span className="text-4xl z-10 drop-shadow-md leading-none">{badge.icon}</span>
      ) : (
        <Award className="text-slate-400 opacity-40 z-10" size={size === 'sm' ? 16 : size === 'lg' ? 32 : 24} />
      )}

      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />

      {/* Rarity dot */}
      <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full ${RARITY_DOT[rarity]} z-20`} />

      {/* Pin button */}
      {isOwner && isEarned && onPin && (
        <button
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          className={`absolute -top-1 -right-1 p-1 rounded-full transition-all z-20 ${
            isPinned
              ? 'bg-amber-400 text-white scale-110 shadow-md'
              : 'bg-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-300'
          }`}
          title={isPinned ? "Desafixar" : "Fixar"}
        >
          <Pin className="w-3 h-3" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}