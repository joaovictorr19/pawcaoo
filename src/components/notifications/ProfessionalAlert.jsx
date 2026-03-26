import React from 'react';
import { Check, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfessionalAlert({ request, onAccept, onDismiss }) {
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-md"
    >
      <div className="bg-slate-900 rounded-[2rem] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden">
        {/* Barra de Progresso/Tempo (Timer de 30s) */}
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 30, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-1 bg-orange-500"
          onAnimationComplete={onDismiss}
        />

        <div className="flex items-center gap-4">
          {/* Foto do Pet que vem no pedido */}
          <div className="relative">
            <img 
              src={request?.pet_photo || 'https://images.unsplash.com/photo-1633722715463-d30628519d7b?w=100&h=100&fit=crop'} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500" 
              alt={request?.pet_name}
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-lg text-white shadow-lg">
              <Zap size={12} fill="currentColor" />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-white font-black uppercase italic text-[11px] leading-tight">
              Novo PawGo: {request?.pet_name || 'Cão'}
            </h4>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
              {request?.distance || '500'}m de ti • {request?.duration || 30} min
            </p>
            <p className="text-orange-500 font-black text-xs mt-1 italic">{request?.price || '15'}€</p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex gap-2 flex-shrink-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAccept}
              className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"
              aria-label="Aceitar pedido"
            >
              <Check size={20} strokeWidth={3} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              className="bg-white/10 hover:bg-white/20 text-white/40 p-4 rounded-2xl active:scale-90 transition-all"
              aria-label="Rejeitar pedido"
            >
              <X size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}