import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, Check, GripVertical, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function BadgeSelectionModal({ 
  isOpen, 
  onClose, 
  earnedBadges, 
  onSelectBadge, 
  currentlyPinnedIds = [], 
  currentSlotIndex = 0 
}) {
  
  const handleBadgeClick = (badge) => {
    const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
    onSelectBadge(uniqueId);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-slate-50 border-0 max-h-[85vh] flex flex-col">
        {/* Header Visual */}
        <div className="px-4 py-4 md:px-6 md:py-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-t-xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Sparkles className="w-32 h-32" />
          </div>
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <DrawerTitle className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Destacar Emblema
              </DrawerTitle>
              <DrawerDescription className="text-slate-300 text-xs md:text-sm mt-1">
                Escolha o emblema perfeito para a <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-full ml-1">Posição {currentSlotIndex + 1}</span>
              </DrawerDescription>
            </div>
            <DrawerClose className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </DrawerClose>
          </div>
          
          {/* Slots Preview */}
          <div className="flex gap-2 mt-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {[0, 1, 2, 3].map((idx) => {
              const isCurrent = idx === currentSlotIndex;
              const badgeId = currentlyPinnedIds[idx];
              const badge = badgeId ? earnedBadges.find(b => (b._uniqueId || b.badge_id || b.id) === badgeId) : null;
              
              return (
                <div 
                  key={idx} 
                  className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border-2 transition-all snap-center ${
                    isCurrent 
                      ? 'border-yellow-400 bg-white/20 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-110 mx-1' 
                      : badge ? 'border-white/20 bg-white/10' : 'border-white/10 bg-black/20 border-dashed'
                  }`}
                >
                  {badge ? (
                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                      {badge.image_png_file || badge.image_url ? (
                        <img 
                          src={badge.image_png_file || badge.image_url} 
                          alt={badge.name} 
                          className="w-full h-full object-contain drop-shadow-md" 
                        />
                      ) : (
                        <span className="text-xl md:text-2xl drop-shadow-md">{badge.icon || "🏆"}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-white/30 text-xs font-bold">{idx + 1}</span>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute -bottom-2 bg-yellow-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      ATUAL
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50">
          {earnedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Sparkles className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Caixa Vazia</h3>
              <p className="text-sm text-slate-500 max-w-xs">Você ainda não tem emblemas. Participe da comunidade para desbloqueá-los!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-8">
              {earnedBadges.map((badge, idx) => {
                const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
                const slotIndexAssigned = currentlyPinnedIds.indexOf(uniqueId);
                const isEquipped = slotIndexAssigned !== -1;
                const isEquippedInCurrent = slotIndexAssigned === currentSlotIndex;
                
                return (
                  <motion.button
                    key={uniqueId}
                    onClick={() => (!isEquipped || isEquippedInCurrent) && handleBadgeClick(badge)}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                    whileTap={(!isEquipped || isEquippedInCurrent) ? { scale: 0.92 } : {}}
                    disabled={isEquipped && !isEquippedInCurrent}
                    className={`relative flex flex-col items-center p-3 rounded-2xl transition-all h-full ${
                      isEquippedInCurrent
                        ? 'bg-yellow-50 border-2 border-yellow-400 shadow-sm'
                        : isEquipped 
                          ? 'bg-slate-100 border-2 border-slate-200 opacity-60 cursor-not-allowed grayscale-[0.3]' 
                          : 'bg-white border-2 border-transparent shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-200'
                    }`}
                  >
                    {isEquipped && !isEquippedInCurrent && (
                      <div className="absolute top-2 right-2 bg-slate-800 text-white rounded-md w-5 h-5 flex items-center justify-center z-10 shadow-sm">
                        <span className="text-[10px] font-black">{slotIndexAssigned + 1}</span>
                      </div>
                    )}
                    
                    {isEquippedInCurrent && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center z-10 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 relative ${
                      badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-100 to-orange-100' :
                      badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-100 to-pink-100' :
                      badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-100 to-cyan-100' :
                      'bg-slate-50'
                    }`}>
                      {badge.image_png_file || badge.image_url ? (
                        <img 
                          src={badge.image_png_file || badge.image_url} 
                          alt={badge.name} 
                          className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm z-10" 
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-3xl md:text-4xl z-10">{badge.icon || "🏆"}</span>
                      )}
                    </div>

                    <div className="flex flex-col items-center mt-auto w-full gap-1.5">
                      <span className="text-[10px] md:text-[11px] font-bold text-center leading-tight text-slate-700 line-clamp-2 w-full">
                        {badge.name}
                      </span>
                      
                      <Badge className={`text-[9px] h-[16px] px-1.5 border-0 uppercase font-bold tracking-wider ${
                        badge.rarity === 'legendary' ? 'bg-yellow-400 text-black' :
                        badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-slate-300 text-slate-700'
                      }`}>
                        {badge.rarity || 'comum'}
                      </Badge>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Info footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center shrink-0">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            No perfil, arraste e solte para mudar a ordem dos destaques
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}