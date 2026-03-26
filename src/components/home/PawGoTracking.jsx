import { MessageCircle, Phone, Dog, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PawGoTracking({ match, onCancel, onMessage, onCall, selectedPet, duration }) {
  if (!match || !selectedPet) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* 🗺️ MAPA PLACEHOLDER */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-300" />

      {/* --- COMPONENTE DE TRACKING (PÓS-SELEÇÃO) --- */}
      <div className="absolute bottom-10 left-6 right-6 z-50 animate-in slide-in-from-bottom-8 duration-700">
        
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white">
          
          {/* RESUMO DO PEDIDO (O QUE JÁ FOI ESCOLHIDO) */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {/* Mostra a foto real do Pet que escolheste no Radar */}
              <div className="relative">
                <img 
                  src={selectedPet?.photo_url} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500 p-0.5 shadow-md" 
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 p-1 rounded-lg text-white">
                  <Dog size={12} />
                </div>
              </div>
              <div>
                <h4 className="font-black uppercase text-[11px] text-slate-900 italic leading-none mb-1">
                  Passeio de {selectedPet?.name}
                </h4>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">
                  {duration} Minutos • {duration === 30 ? '12,00€' : '20,00€'}
                </p>
              </div>
            </div>

            <div className="bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
              <span className="text-[9px] font-black text-green-600 uppercase animate-pulse">A Caminho</span>
            </div>
          </div>

          {/* INFO DO PROFISSIONAL (O "MATCH") */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                  <AvatarImage src={match?.walker_photo} />
                  <AvatarFallback>{match?.walker_name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{match?.walker_name}</p>
                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                   <Star size={8} className="fill-orange-400 text-orange-400" /> 4.9 • {match?.distance || '850m'}
                </div>
              </div>
            </div>
            
            {/* Botões de Ação Rápida */}
            <div className="flex gap-2">
              <button onClick={onMessage} className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 active:scale-90 transition-all shadow-sm">
                <MessageCircle size={18} />
              </button>
              <button onClick={onCall} className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <Phone size={18} />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}