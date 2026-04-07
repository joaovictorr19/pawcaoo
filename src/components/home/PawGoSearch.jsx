import { useState, useEffect } from 'react';
import { Zap, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PawGoSearch() {
  const [onlineCount, setOnlineCount] = useState(0);
  const navigate = useNavigate();

  // Efeito para contar quantos profissionais estão online
  useEffect(() => {
    const checkOnline = async () => {
           try {
             const walkers = await base44.entities.WalkerProfile.filter({ is_online: true });
             console.log('🔍 PawGo Online Count:', walkers?.length || 0, 'Data:', walkers);
             setOnlineCount(walkers?.length || 0);
           } catch (err) {
             console.error('Error fetching online walkers:', err);
           }
    };
    checkOnline();
    const interval = setInterval(checkOnline, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6 py-8">
      <div className="bg-slate-900 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl shadow-orange-500/20">
        {/* Efeito de Radar ao fundo - removido */}

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {onlineCount} Passeadores Online Agora
            </span>
          </div>

          <h2 className="text-3xl font-black text-white italic leading-tight mb-2 uppercase">
            Precisa de um<br/>passeio agora?
          </h2>
          <p className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-tighter">
            Encontre o profissional mais próximo em segundos
          </p>

          <button 
            onClick={() => navigate(createPageUrl('PostEmergency'))}
            className="w-full h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all bg-orange-500 text-white shadow-[0_10px_20px_rgba(249,115,22,0.3)] active:scale-95"
          >
            <Zap size={20} fill="currentColor" /> Chamar PawGo
          </button>
        </div>
      </div>
    </div>
  );
}