import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function DogAchievementNotification({ achievement, dogName, onClose }) {
  useEffect(() => {
    if (achievement) {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#fb923c']
      });

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 to-yellow-600"
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto"
      >
        <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity] || rarityColors.common} p-1 rounded-2xl shadow-2xl`}>
          <div className="bg-white rounded-xl p-6 relative overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <Sparkles className="absolute top-1/2 right-8 w-5 h-5 text-yellow-200 animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Content */}
            <div className="text-center relative z-10">
              <div className="mb-3">
                <Trophy className="w-12 h-12 mx-auto text-yellow-600 mb-2" />
                <h3 className="text-lg font-bold text-gray-900">
                  {dogName} Desbloqueou!
                </h3>
              </div>

              <div className="text-6xl mb-3 animate-bounce">
                {achievement.icon}
              </div>

              <div className="mb-2">
                <div className="text-xl font-bold text-gray-900">{achievement.name}</div>
                <div className="text-sm text-gray-600 mt-1">{achievement.description}</div>
              </div>

              <Badge className={`${rarityColors[achievement.rarity]?.replace('from-', 'bg-').replace(' to-yellow-600', '')} text-white mt-2`}>
                {achievement.rarity === 'common' ? 'Comum' : 
                 achievement.rarity === 'rare' ? 'Raro' :
                 achievement.rarity === 'epic' ? 'Épico' : 'Lendário'}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}