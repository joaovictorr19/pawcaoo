import React from 'react';
import { Dog, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TutorUpdate({ status, walkerName, onDismiss, petName }) {
  const statusMessages = {
    arrived: `chegou à porta do ${petName || 'seu cão'}!`,
    started: `iniciou o passeio com ${petName || 'seu cão'}.`,
    in_progress: `está a passear ${petName || 'seu cão'}.`,
    completed: `terminou o passeio com ${petName || 'seu cão'}.`,
    photo_update: `enviou uma foto de ${petName || 'seu cão'}!`
  };

  const statusIcons = {
    arrived: '📍',
    started: '🚶',
    in_progress: '🐕',
    completed: '✅',
    photo_update: '📸'
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-24 left-6 right-6 z-[100] mx-auto max-w-md"
    >
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600 text-xl">
            {statusIcons[status] || '🐾'}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-900 leading-none mb-1">
              Status do Passeio
            </p>
            <p className="text-[11px] font-medium text-slate-600">
              O <span className="font-bold text-slate-900">{walkerName || 'Profissional'}</span> {statusMessages[status] || 'atualização disponível.'}
            </p>
          </div>
        </div>

        {/* Botão de Fechar Minimalista */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDismiss}
          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors flex-shrink-0"
          aria-label="Fechar notificação"
        >
          <X size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}