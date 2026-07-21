import React from 'react';
import { Award } from 'lucide-react';

const RARITY_GLOW = {
  legendary: 'ring-2 ring-yellow-400/60 shadow-yellow-200',
  epic:      'ring-2 ring-purple-400/60 shadow-purple-200',
  rare:      'ring-2 ring-blue-400/60 shadow-blue-200',
  common:    'ring-1 ring-gray-200',
};

const RARITY_BG = {
  legendary: 'bg-gradient-to-br from-yellow-50 to-orange-50',
  epic:      'bg-gradient-to-br from-purple-50 to-pink-50',
  rare:      'bg-gradient-to-br from-blue-50 to-cyan-50',
  common:    'bg-white',
};

const RARITY_LABEL = {
  legendary: 'Lendário',
  epic: 'Épico',
  rare: 'Raro',
  common: 'Comum',
};

const RARITY_TEXT = {
  legendary: 'text-yellow-600',
  epic: 'text-purple-600',
  rare: 'text-blue-600',
  common: 'text-gray-500',
};

export default function BadgeItem({ badge, isPinned, onPin, isOwner, isEarned, size = 'md', expanded = false }) {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16 md:w-20 md:h-20';
  const imgClass  = size === 'sm' ? 'w-8 h-8'  : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10 md:w-14 md:h-14';

  const rarity = badge.rarity || 'common';
  const imageUrl = badge.image_png_file || badge.image_url;

  const badgeIcon = (
    <div className={`relative ${sizeClass} rounded-2xl flex items-center justify-center shadow-md overflow-hidden group cursor-default ${RARITY_GLOW[rarity]} ${RARITY_BG[rarity]} flex-shrink-0`}>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={badge.name}
          className={`${imgClass} object-contain drop-shadow-lg z-10 p-1 badge-img-pixel`}
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
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />

      {/* Pin button */}
      {isOwner && isEarned && onPin && (
        <button
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          className={`absolute -top-1 -right-1 p-1 rounded-full transition-all z-20 ${
            isPinned
              ? 'bg-yellow-400 text-white scale-110 shadow-md'
              : 'bg-gray-300 text-gray-500 opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? "Desafixar" : "Fixar"}
        >
          <span className="text-[10px] font-black">📌</span>
        </button>
      )}
    </div>
  );

  if (expanded) {
    return (
      <div className="flex items-center gap-3">
        {badgeIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-slate-900 truncate">{badge.name}</p>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${RARITY_BG[rarity]} ${RARITY_TEXT[rarity]}`}>
              {RARITY_LABEL[rarity]}
            </span>
          </div>
          {badge.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{badge.description}</p>
          )}
        </div>
      </div>
    );
  }

  return badgeIcon;
}