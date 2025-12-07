import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LaunchBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="bg-white/20 p-2 rounded-full hidden sm:block">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">
                🚀 Lançamento Oficial no Porto!
              </p>
              <p className="text-xs sm:text-sm text-white/90">
                Walkers: <span className="font-bold text-yellow-300">0% de Comissão</span> nos primeiros 3 meses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              size="sm" 
              onClick={() => navigate(createPageUrl('BecomeWalker'))}
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold border-0 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
            >
              Começar Agora <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </motion.div>
    </AnimatePresence>
  );
}