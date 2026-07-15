import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BadgeNotification({ badge, onClose }) {
  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 50 }}
        className="fixed bottom-6 right-6 z-[9999] max-w-sm"
      >
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl shadow-2xl p-6 border-2 border-white/20 backdrop-blur-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg"
              >
                {badge.image_png_file || badge.image_url ? (
                  <img
                    src={badge.image_png_file || badge.image_url}
                    alt={badge.name}
                    className="w-full h-full object-contain p-1 rounded-xl badge-img-pixel"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-5xl">{badge.icon || '🏅'}</span>
                )}
              </motion.div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-black text-lg">Emblema Conquistado!</h3>
              </div>
              <p className="font-bold text-xl mb-1">{badge.name}</p>
              <p className="text-sm text-white/90">{badge.description}</p>
              {badge.xp_reward && (
                <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 inline-block">
                  <span className="font-bold text-sm">+{badge.xp_reward} XP</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}