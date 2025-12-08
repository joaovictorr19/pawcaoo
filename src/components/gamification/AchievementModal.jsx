import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";

export default function AchievementModal({ isOpen, onClose, badgeData }) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti explosion
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999 // Ensure it's above the modal
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!badgeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-white/30 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
          
          {/* Header Title */}
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-widest text-gray-900 drop-shadow-sm flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
              CONQUISTA DESBLOQUEADA!
            </DialogTitle>
          </DialogHeader>

          {/* Animated Badge Image */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative z-10"
            >
              {badgeData.image ? (
                <img 
                  src={badgeData.image} 
                  alt={badgeData.name} 
                  className="w-32 h-32 object-contain drop-shadow-2xl animate-[bounce_3s_infinite]" 
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full flex items-center justify-center shadow-xl animate-[bounce_3s_infinite] border-4 border-white">
                  <span className="text-6xl">{badgeData.icon || "🏆"}</span>
                </div>
              )}
            </motion.div>
            
            {/* Floating Sparkles */}
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute bottom-0 -left-4 w-6 h-6 text-purple-400 animate-pulse delay-75" />
          </div>

          {/* Badge Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800">{badgeData.name}</h2>
            <p className="text-gray-700 font-medium max-w-[80%] mx-auto leading-relaxed">
              {badgeData.description}
            </p>
          </div>

          {/* XP Gain */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-green-100/80 backdrop-blur-sm border-2 border-green-500 px-6 py-2 rounded-full transform -rotate-2 shadow-lg"
          >
            <span className="text-2xl font-black text-green-600 drop-shadow-sm">
              +{badgeData.xp || 0} XP
            </span>
          </motion.div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full max-w-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-6 text-lg rounded-xl shadow-xl transform transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
          >
            Recolher Prémio
          </Button>

        </div>
        
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      </DialogContent>
    </Dialog>
  );
}