import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PetCareAssistant from './PetCareAssistant';
import { useLanguage } from '@/components/LanguageContext';

export default function PetCareAssistantButton({ userDogs = [] }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const tooltipText = {
    pt: 'Assistente de Cuidados Pet',
    es: 'Asistente de Cuidados Pet',
    en: 'Pet Care Assistant',
    fr: 'Assistant Soins Animaux'
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-[9998]"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-2xl group relative overflow-hidden"
            >
              {/* Pulse effect */}
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              
              <div className="relative z-10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
              </div>
            </Button>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {tooltipText[language] || tooltipText['pt']}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <PetCareAssistant 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        userDogs={userDogs}
      />
    </>
  );
}