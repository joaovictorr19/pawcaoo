import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PinnedBadgesDisplay({ 
  pinnedBadgeIds = [], 
  earnedBadges = [], 
  isOwnProfile = false, 
  onSlotClick,
  onReorder 
}) {
  
  // Get actual badge objects from IDs
  const pinnedBadges = pinnedBadgeIds
    .map(id => id ? earnedBadges.find(b => (b._uniqueId || b.badge_id || b.id) === id) : null)
    .filter(Boolean); // Remove nulls for public view

  // Public view - clean badge showcase
  if (!isOwnProfile) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <AnimatePresence>
          {pinnedBadges.map((badge, idx) => (
            <motion.div
              key={badge._uniqueId || badge.badge_id || badge.id || idx}
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: idx * 0.1 }}
            >
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 ${
                      badge.rarity === 'legendary' ? 'border-yellow-400/60 bg-gradient-to-br from-yellow-50 to-orange-50' :
                      badge.rarity === 'epic' ? 'border-purple-400/60 bg-gradient-to-br from-purple-50 to-pink-50' :
                      badge.rarity === 'rare' ? 'border-blue-400/60 bg-gradient-to-br from-blue-50 to-cyan-50' :
                      'border-gray-300 bg-white'
                    }`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-2xl blur-md opacity-30 ${
                        badge.rarity === 'legendary' ? 'bg-yellow-400' :
                        badge.rarity === 'epic' ? 'bg-purple-400' :
                        badge.rarity === 'rare' ? 'bg-blue-400' :
                        'bg-gray-300'
                      }`} />
                      
                      {badge.image_png_file || badge.image_url ? (
                        <img 
                          src={badge.image_png_file || badge.image_url} 
                          alt={badge.name} 
                          className="w-10 h-10 object-contain z-10 drop-shadow-lg" 
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-3xl z-10 drop-shadow-md">{badge.icon || '🏆'}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-800 shadow-xl z-50">
                    <p className="font-bold text-sm">{badge.name}</p>
                    {badge.description && (
                      <p className="text-xs text-gray-300 mt-1">{badge.description}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {pinnedBadges.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhum emblema destacado</p>
        )}
      </div>
    );
  }

  // Owner view - click to select
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Emblemas
        </p>
        <p className="text-[10px] text-gray-400">
          Clique para selecionar
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        {[0, 1, 2, 3].map((slotIdx) => {
          const badgeId = pinnedBadgeIds[slotIdx];
          const badge = badgeId ? earnedBadges.find(b => (b._uniqueId || b.badge_id || b.id) === badgeId) : null;
          
          return (
            <TooltipProvider key={`slot-${slotIdx}`} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSlotClick?.(slotIdx)}
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                      badge 
                        ? badge.rarity === 'legendary' 
                          ? 'border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-50 to-orange-50' 
                          : badge.rarity === 'epic'
                          ? 'border-2 border-purple-400/60 bg-gradient-to-br from-purple-50 to-pink-50'
                          : badge.rarity === 'rare'
                          ? 'border-2 border-blue-400/60 bg-gradient-to-br from-blue-50 to-cyan-50'
                          : 'border-2 border-gray-300 bg-white'
                        : 'border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50'
                    }`}
                  >
                    {/* Slot number */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20">
                      {slotIdx + 1}
                    </div>
                    
                    {badge ? (
                      <>
                        {/* Glow */}
                        <div className={`absolute inset-0 rounded-2xl blur-md opacity-20 ${
                          badge.rarity === 'legendary' ? 'bg-yellow-400' :
                          badge.rarity === 'epic' ? 'bg-purple-400' :
                          badge.rarity === 'rare' ? 'bg-blue-400' :
                          'bg-gray-300'
                        }`} />
                        
                        {badge.image_png_file || badge.image_url ? (
                          <img 
                            src={badge.image_png_file || badge.image_url} 
                            alt={badge.name} 
                            className="w-10 h-10 object-contain z-10 drop-shadow-lg" 
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="text-3xl z-10 drop-shadow-md">{badge.icon || '🏆'}</span>
                        )}
                      </>
                    ) : (
                      <Plus className="w-6 h-6 text-gray-400" />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-800 shadow-xl z-50">
                  {badge ? (
                    <>
                      <p className="font-bold text-sm">{badge.name}</p>
                      {badge.description && (
                        <p className="text-xs text-gray-300 mt-1 max-w-[180px]">{badge.description}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">Clique para substituir</p>
                    </>
                  ) : (
                    <p className="font-bold text-sm">Adicionar Emblema</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}