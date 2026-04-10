import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Zap, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';


export default function ProfileActions({ walker, currentUser }) {
  const navigate = useNavigate();


  const handlePawGoClick = () => {
    if (!currentUser) {
      return;
    }
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="flex flex-col gap-6 mt-6 pb-20">
      
      {/* 🟢 BLOCO 1: PAWGO (ESTILO UBER - CHAMADA DIRETA) */}
      {walker?.is_online ? (
        <div className="bg-orange-50 rounded-[2.5rem] p-6 border-2 border-orange-100 shadow-lg shadow-orange-500/10 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-2 rounded-xl text-white animate-pulse">
                <Zap size={18} fill="currentColor" />
              </div>
              <h4 className="font-black uppercase text-[11px] tracking-widest text-orange-600 italic">PawGo Ativo</h4>
            </div>
            <span className="text-[9px] font-black bg-white px-3 py-1 rounded-full text-orange-500 border border-orange-200">PEDIDO IMEDIATO</span>
          </div>
          
          <p className="text-[11px] text-slate-500 mb-4 leading-tight font-medium">
            O profissional está na rua agora! Podes pedir um passeio que começa nos próximos 15-30 min.
          </p>

          <Button 
            onClick={handlePawGoClick}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.1em] shadow-xl active:scale-95 transition-transform"
          >
            <Zap size={16} className="mr-2" fill="currentColor" />
            Chamar {walker?.walker_name?.split(' ')[0] || 'Profissional'} Agora
          </Button>
        </div>
      ) : (
        /* ⚪️ AVISO SE ESTIVER OFFLINE */
        <div className="bg-slate-50 rounded-[2.5rem] p-4 border border-slate-200 flex items-center gap-3">
          <div className="bg-slate-200 p-2 rounded-xl text-slate-400">
            <Zap size={16} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            PawGo Offline • Use a agenda para amanhã
          </p>
        </div>
      )}


    </div>
  );
}