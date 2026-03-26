import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Phone, Clock, Dog, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PawGoTracking({ match, onCancel, onMessage, onCall }) {
  const [estimatedTime, setEstimatedTime] = useState(match?.distance_km ? Math.ceil((match.distance_km / 4) * 10) : 8);
  const [startTime] = useState(new Date());

  // Decrementa tempo estimado a cada minuto (simulação de movimento real)
  useEffect(() => {
    const interval = setInterval(() => {
      setEstimatedTime(prev => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!match) return null;

  const walkerFirstName = match.walker_name?.split(' ')[0] || 'Profissional';
  const formattedTime = startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      
      {/* 🗺️ MAPA - Placeholder para integração com Base44 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center text-slate-400 relative">
          <MapPin size={48} className="mb-4 text-slate-300" />
          <p className="font-bold text-xs uppercase tracking-widest">A carregar mapa em tempo real...</p>
          <p className="text-[10px] mt-2">O passeador está a {match.distance_km || 0.85}km de distância</p>
        </div>
        
        {/* Marcador do Profissional no Mapa */}
        <div className="absolute top-1/2 left-1/3 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Avatar className="w-16 h-16 border-4 border-white shadow-2xl rounded-full scale-110 animate-pulse">
              <AvatarImage src={match.walker_photo} alt={match.walker_name} />
              <AvatarFallback className="bg-orange-500 text-white font-black text-lg">
                {walkerFirstName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-orange-500 p-1.5 rounded-xl text-white shadow-lg animate-bounce">
              <Zap size={16} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* CABEÇALHO FLUTUANTE - Tempo Estimado */}
      <div className="relative z-10 px-6 pt-16">
        <div className="bg-slate-900 rounded-full p-6 shadow-2xl shadow-slate-900/40 border border-white/10 text-center animate-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-3">
            <Clock size={12} className="text-orange-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Chegada Estimada</span>
          </div>
          <h2 className="text-5xl font-black text-white italic leading-none">{estimatedTime} min</h2>
        </div>
      </div>

      {/* PAINEL DE AÇÕES FLUTUANTE - Bottom Sheet Style */}
      <div className="absolute bottom-6 left-6 right-6 z-10 space-y-4">
        
        {/* Card do Profissional */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-[0_15px_60px_rgba(0,0,0,0.15)] border border-white/50 animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex justify-between items-start gap-4 mb-6">
            {/* Info do Profissional */}
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-20 h-20 border-4 border-white shadow-xl rounded-[2rem] flex-shrink-0">
                <AvatarImage src={match.walker_photo} alt={match.walker_name} />
                <AvatarFallback className="bg-orange-500 text-white font-black text-2xl">
                  {walkerFirstName[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight truncate">
                  {walkerFirstName}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                  <Dog size={12} /> Passeando o {match.pet_name || 'cão'}
                </div>
                {match.walker_rating && (
                  <div className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter mt-1">
                    ⭐ {match.walker_rating}/5
                  </div>
                )}
              </div>
            </div>
            
            {/* Botões de Contacto */}
            <div className="flex gap-2.5 flex-shrink-0">
              <button 
                onClick={onMessage}
                className="w-14 h-14 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                aria-label="Enviar mensagem"
              >
                <MessageCircle size={22} />
              </button>
              <button 
                onClick={onCall}
                className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:bg-green-600 active:scale-95 transition-all"
                aria-label="Ligar"
              >
                <Phone size={22} />
              </button>
            </div>
          </div>
          
          {/* Status do Passeio */}
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3">
            <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black uppercase text-slate-500 italic tracking-tighter">
              PASSEIO ATIVO
            </span>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              {walkerFirstName} começou às {formattedTime}.
            </p>
          </div>
        </div>

        {/* Botão Cancelar */}
        <button 
          onClick={onCancel}
          className="w-full text-center text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors active:scale-95 py-3"
        >
          Cancelar Pedido
        </button>
      </div>

    </div>
  );
}