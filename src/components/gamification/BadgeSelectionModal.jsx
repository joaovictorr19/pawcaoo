import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[75vh] bg-white border-0 shadow-2xl overflow-hidden flex flex-col p-0 rounded-2xl">
        
        {/* Header Compacto */}
        <div className="relative px-5 pt-5 pb-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Slot {currentSlotIndex + 1}
              </DialogTitle>
              <p className="text-xs text-gray-600 mt-0.5">
                Selecione um emblema
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-200"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 px-5 py-4">
          {earnedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Nenhum emblema</p>
              <p className="text-xs text-gray-500">
                Complete atividades para ganhar emblemas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pb-2">
              {earnedBadges.map((badge, idx) => {
                const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
                const isEquipped = currentlyPinnedIds.includes(uniqueId);
                const slotNumber = isEquipped ? currentlyPinnedIds.indexOf(uniqueId) + 1 : null;
                
                return (
                  <motion.button
                    key={uniqueId}
                    onClick={() => !isEquipped && handleBadgeClick(badge)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={!isEquipped ? { scale: 1.05, y: -2 } : {}}
                    whileTap={!isEquipped ? { scale: 0.95 } : {}}
                    className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
                      isEquipped 
                        ? 'bg-green-50 border-2 border-green-500 cursor-default' 
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer hover:shadow-md'
                    }`}
                  >
                    {/* Slot Indicator */}
                    {isEquipped && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 shadow-md flex items-center justify-center border-2 border-white z-10">
                        <span className="text-[10px] font-bold">{slotNumber}</span>
                      </div>
                    )}

                    {/* Badge Image */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative ${
                      badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-100 to-orange-100' :
                      badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-100 to-pink-100' :
                      badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-100 to-cyan-100' :
                      'bg-white'
                    }`}>
                      {badge.image_png_file || badge.image_url ? (
                        <img 
                          src={badge.image_png_file || badge.image_url} 
                          alt={badge.name} 
                          className="w-11 h-11 object-contain drop-shadow-sm" 
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-3xl">{badge.icon || "🏆"}</span>
                      )}
                    </div>

                    {/* Badge Name */}
                    <span className="text-[11px] font-semibold text-center leading-tight text-gray-700 line-clamp-2">
                      {badge.name}
                    </span>
                    
                    {/* Rarity */}
                    <Badge className={`mt-1.5 text-[9px] h-4 px-1.5 border-0 capitalize ${
                      badge.rarity === 'legendary' ? 'bg-yellow-400 text-black' :
                      badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                      badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {badge.rarity || 'comum'}
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}