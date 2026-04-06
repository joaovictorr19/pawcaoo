import React from 'react';
import { Award, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export default function BadgeItem({ badge, isPinned, onPin, isOwner, isEarned, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16 md:w-20 md:h-20';
  const imgClass  = size === 'sm' ? 'w-8 h-8'  : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10 md:w-14 md:h-14';

  const rarity = badge.rarity || 'common';
  const imageUrl = badge.image_png_file || badge.image_url;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${sizeClass} rounded-2xl flex items-center justify-center shadow-md overflow-hidden group cursor-default ${RARITY_GLOW[rarity]} ${RARITY_BG[rarity]}`}>

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={badge.name}
                className={`${imgClass} object-contain drop-shadow-lg z-10`}
                loading="lazy"
                decoding="async"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : badge.icon ? (
              <span className="text-3xl z-10 drop-shadow-md">{badge.icon}</span>
            ) : (
              <Award className="text-slate-400 opacity-40 z-10" size={24} />
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
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-800 shadow-xl max-w-[200px]">
          <p className="font-bold text-sm">{badge.name}</p>
          {badge.description && <p className="text-xs text-gray-300 mt-0.5">{badge.description}</p>}
          {badge.xp > 0 && (
            <p className="flex items-center gap-1 text-xs text-amber-400 mt-1 font-bold">
              <Zap size={11} /> +{badge.xp} XP
            </p>
          )}
          {rarity !== 'common' && (
            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{rarity}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}