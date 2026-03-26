import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, MessageCircle, Phone, Clock, Dog, Zap, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { base44 } from '@/api/base44Client';

export default function PawGoTracking({ match, onCancel, onMessage, onCall, selectedPet, duration }) {
  const [estimatedTime, setEstimatedTime] = useState(match?.distance_km ? Math.ceil((match.distance_km / 4) * 10) : 8);
  const [startTime] = useState(new Date());
  const [walkerData, setWalkerData] = useState(match);

  // Real-time refetch walker location & is_online status every 7 seconds
  const { data: liveWalkerData } = useQuery({
    queryKey: ['walkerLiveTracking', match?.walker_id],
    queryFn: async () => {
      if (!match?.walker_id) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ id: match.walker_id });
      return profiles[0] || null;
    },
    enabled: !!match?.walker_id,
    refetchInterval: 7000, // Refetch a cada 7 segundos
    refetchOnWindowFocus: true,
    staleTime: 0, // Sempre considerado stale
  });

  // Live subscription: detectar mudanças de is_online
  useEffect(() => {
    if (!match?.walker_id) return;
    const unsubscribe = base44.entities.WalkerProfile.subscribe((event) => {
      if (event.id === match.walker_id && event.type === 'update') {
        setWalkerData(prev => ({ ...prev, is_online: event.data?.is_online }));
      }
    });
    return unsubscribe;
  }, [match?.walker_id]);

  // Sincronizar liveWalkerData com estado local
  useEffect(() => {
    if (liveWalkerData) {
      setWalkerData(prev => ({
        ...prev,
        ...liveWalkerData,
        walker_lat: liveWalkerData.latitude,
        walker_lng: liveWalkerData.longitude,
        distance_km: prev.distance_km // Manter distância se não tiver novo valor
      }));
    }
  }, [liveWalkerData]);

  // Decrementa tempo estimado a cada minuto (simulação de movimento real)
  useEffect(() => {
    const interval = setInterval(() => {
      setEstimatedTime(prev => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!match) return null;

  const walkerFirstName = walkerData?.walker_name?.split(' ')[0] || 'Profissional';
  const formattedTime = startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const isWalkerOnline = walkerData?.is_online !== false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      
      {/* 🗺️ MAPA - Placeholder para integração com Base44 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-300">
        <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center text-slate-400 relative">
          <MapPin size={48} className="mb-4 text-slate-300" />
          <p className="font-bold text-xs uppercase tracking-widest">A carregar mapa em tempo real...</p>
          <p className="text-[10px] mt-2">O passeador está a {walkerData?.distance_km || match.distance_km || 0.85}km de distância</p>
        </div>
        
        {/* Marcador do Profissional no Mapa */}
        <div className="absolute top-1/2 left-1/3 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Avatar className={`w-16 h-16 border-4 border-white shadow-2xl rounded-full scale-110 ${isWalkerOnline ? 'animate-pulse' : 'opacity-50 grayscale'}`}>
              <AvatarImage src={walkerData?.photo_url || match.walker_photo} alt={walkerData?.walker_name || match.walker_name} />
              <AvatarFallback className={`${isWalkerOnline ? 'bg-orange-500' : 'bg-slate-400'} text-white font-black text-lg`}>
                {walkerFirstName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-xl text-white shadow-lg ${isWalkerOnline ? 'bg-orange-500 animate-bounce' : 'bg-slate-400'}`}>
             {isWalkerOnline ? <Zap size={16} fill="currentColor" /> : <AlertCircle size={16} />}
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
            <div className={`px-3 py-1.5 rounded-full border ${isWalkerOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
             <span className={`text-[9px] font-black uppercase ${isWalkerOnline ? 'text-green-600 animate-pulse' : 'text-red-600'}`}>
               {isWalkerOnline ? 'A Caminho' : 'Conexão Perdida'}
             </span>
            </div>
          </div>

          {/* Info do Profissional que aceitou */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-3">
              <Avatar className={`w-10 h-10 border-2 border-white shadow-sm ${!isWalkerOnline && 'grayscale opacity-60'}`}>
               <AvatarImage src={walkerData?.photo_url || match?.walker_photo} />
              </Avatar>
              <div>
               <p className="text-[10px] font-black uppercase text-slate-900">{walkerData?.walker_name || match?.walker_name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Passeador Profissional</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onMessage} disabled={!isWalkerOnline} className={`p-3 border rounded-xl active:scale-90 transition-all ${isWalkerOnline ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}>
               <MessageCircle size={18} />
              </button>
              <button onClick={onCall} disabled={!isWalkerOnline} className={`p-3 text-white rounded-xl shadow-lg active:scale-90 transition-all ${isWalkerOnline ? 'bg-green-500 shadow-green-500/20' : 'bg-slate-400 shadow-slate-400/20 cursor-not-allowed opacity-50'}`}>
               <Phone size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}