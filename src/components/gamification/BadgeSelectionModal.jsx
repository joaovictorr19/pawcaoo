import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
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
      <DialogContent className="max-w-2xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col p-0">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Escolher Emblema
              </DialogTitle>
              <p className="text-sm text-gray-400">
                Selecione um emblema para o <span className="text-blue-400 font-semibold">Slot {currentSlotIndex + 1}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 px-6 py-4">
          {earnedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-white font-semibold mb-2">Ainda sem emblemas</p>
              <p className="text-sm text-gray-400 max-w-xs">
                Complete passeios, deixe avaliações e participe da comunidade para ganhar emblemas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-4">
              {earnedBadges.map((badge, idx) => {
                const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
                const isEquipped = currentlyPinnedIds.includes(uniqueId);
                const slotNumber = isEquipped ? currentlyPinnedIds.indexOf(uniqueId) + 1 : null;
                
                return (
                  <motion.button
                    key={uniqueId}
                    onClick={() => !isEquipped && handleBadgeClick(badge)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={!isEquipped ? { scale: 1.05, y: -4 } : {}}
                    whileTap={!isEquipped ? { scale: 0.95 } : {}}
                    className={`relative flex flex-col items-center p-3 rounded-2xl transition-all ${
                      isEquipped 
                        ? 'bg-green-500/20 border-2 border-green-500 cursor-default' 
                        : 'bg-white/5 border-2 border-white/10 hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {isEquipped && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 shadow-lg flex items-center justify-center border-2 border-slate-900 z-10">
                        <span className="text-xs font-bold">{slotNumber}</span>
                      </div>
                    )}

                    {/* Badge Visual */}
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 relative ${
                      badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' :
                      badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400/20 to-pink-500/20' :
                      badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400/20 to-cyan-500/20' :
                      'bg-white/5'
                    }`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-xl blur-lg opacity-30 ${
                        badge.rarity === 'legendary' ? 'bg-yellow-400' :
                        badge.rarity === 'epic' ? 'bg-purple-400' :
                        badge.rarity === 'rare' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`} />
                      
                      {badge.image_png_file || badge.image_url ? (
                        <img 
                          src={badge.image_png_file || badge.image_url} 
                          alt={badge.name} 
                          className="w-12 h-12 object-contain z-10 drop-shadow-lg" 
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-3xl z-10 drop-shadow-md">{badge.icon || "🏆"}</span>
                      )}
                    </div>

                    {/* Badge Name */}
                    <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2 mb-1">
                      {badge.name}
                    </span>
                    
                    {/* Rarity Badge */}
                    <Badge className={`text-[10px] h-5 px-2 border-0 capitalize ${
                      badge.rarity === 'legendary' ? 'bg-yellow-500/90 text-black' :
                      badge.rarity === 'epic' ? 'bg-purple-500/90 text-white' :
                      badge.rarity === 'rare' ? 'bg-blue-500/90 text-white' :
                      'bg-gray-500/90 text-white'
                    }`}>
                      {badge.rarity || 'comum'}
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/50">
          <p className="text-xs text-gray-400 text-center">
            💡 Emblemas já fixados aparecem com um número verde
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}