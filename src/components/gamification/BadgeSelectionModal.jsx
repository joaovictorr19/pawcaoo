import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Trophy, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BadgeSelectionModal({ isOpen, onClose, earnedBadges, onSelectBadge, currentlyPinnedIds = [], maxSlots = 4, currentSlotIndex = 0 }) {
  
  const handleBadgeClick = (badge) => {
    // Use centralized unique ID system
    const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
    onSelectBadge(uniqueId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] bg-white border-0 shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Escolher Emblema para Slot {currentSlotIndex + 1}
          </DialogTitle>
          <DialogDescription>
            Selecione um emblema para o <strong>Slot {currentSlotIndex + 1}</strong> de {maxSlots}. Este emblema será exibido no seu perfil.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4 mt-2">
          {earnedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 space-y-3">
              <div className="bg-gray-100 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">Ainda não tens emblemas.</p>
              <p className="text-sm">Completa passeios e interage com a comunidade para ganhar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pb-4">
              {earnedBadges.map((badge, idx) => {
                const uniqueId = badge._uniqueId || badge.badge_id || badge.id;
                const isEquipped = currentlyPinnedIds.includes(uniqueId);
                
                return (
                  <button
                    key={uniqueId}
                    onClick={() => handleBadgeClick(badge)}
                    className={`
                      relative group flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 min-h-[44px] touch-manipulation
                      ${isEquipped 
                        ? 'border-green-500 bg-green-50 cursor-default' 
                        : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50 cursor-pointer hover:shadow-md active:scale-95'
                      }
                    `}
                  >
                    {/* Equipped Indicator with Slot Number */}
                    {isEquipped && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 shadow-md z-50 flex items-center justify-center">
                        <span className="text-xs font-bold">{currentlyPinnedIds.indexOf(uniqueId) + 1}</span>
                      </div>
                    )}

                    {/* Badge Image */}
                    <div className="w-16 h-16 mb-2 relative flex items-center justify-center">
                      {badge.image_png_file ? (
                        <img 
                          src={badge.image_png_file} 
                          alt={badge.name} 
                          className={`w-full h-full object-contain drop-shadow-sm transition-transform ${!isEquipped && 'group-hover:scale-110'}`} 
                        />
                      ) : (
                        <span className={`text-4xl transition-transform ${!isEquipped && 'group-hover:scale-110'}`}>
                          {badge.icon || "🏆"}
                        </span>
                      )}
                    </div>

                    {/* Badge Name */}
                    <span className="text-xs font-semibold text-center leading-tight text-gray-700 line-clamp-2 w-full">
                      {badge.name}
                    </span>
                    
                    {/* Rarity Pill */}
                    <Badge variant="outline" className={`mt-2 text-[10px] h-4 px-1.5 border-0 ${
                      badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {badge.rarity || 'comum'}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}