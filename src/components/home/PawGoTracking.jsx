import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Phone, Clock, Dog, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PawGoTracking({ match, onCancel, onMessage, onCall, selectedPet, duration }) {
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

      {/* --- PAINEL DE ACOMPANHAMENTO ATIVO (Pós-Seleção) --- */}
      <div className="absolute bottom-6 left-6 right-6 z-20 space-y-4">
        
        {/* Card do Match Real */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-6 shadow-2xl border border-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Mostra o Cão que selecionaste anteriormente */}
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-orange-500 p-0.5">
                  <AvatarImage src={selectedPet?.photo_url} className="rounded-full object-cover" />
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-slate-900 p-1 rounded-lg text-white">
                  <Dog size={12} />
                </div>
              </div>
              <div>
                <h4 className="font-black uppercase text-[11px] text-slate-900 italic">Passeio de {selectedPet?.name}</h4>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">
                  {duration} Minutos • {duration === 30 ? '12€' : '20€'}
                </p>
              </div>
            </div>
            
            {/* Indicador de Status */}
            <div className="bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <span className="text-[9px] font-black text-green-600 uppercase animate-pulse">A Caminho</span>
            </div>
          </div>

          {/* Info do Profissional que aceitou */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                <AvatarImage src={match?.walker_photo} />
              </Avatar>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-900">{match?.walker_name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Passeador Profissional</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onMessage} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 active:scale-90 transition-all">
                <MessageCircle size={18} />
              </button>
              <button onClick={onCall} className="p-3 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 active:scale-90 transition-all">
                <Phone size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}