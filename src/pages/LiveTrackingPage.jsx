import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveWalkMap from '@/components/tracking/LiveWalkMap';
import ChatWindow from '@/components/chat/ChatWindow';
import WalkerGPSButton from '@/components/tracking/WalkerGPSButton';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronLeft } from 'lucide-react';
import { createPageUrl } from "@/utils";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Robust ID extraction: URL param > Query Param
  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = id || searchParams.get('id') || searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get User
        const user = await base44.auth.me();
        if (!user) throw new Error("Usuário não logado");
        setCurrentUser(user);

        // 2. Get Booking
        if (!bookingId) throw new Error("ID da reserva não fornecido");
        
        // Base44 filter returns array
        const data = await base44.entities.Booking.filter({ id: bookingId });
        
        if (!data || data.length === 0) throw new Error("Reserva não encontrada");

        setBooking(data[0]);
      } catch (err) {
        console.error("Erro Tracking:", err);
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId]);

  // 1. Tratamento de Erro (Evita Tela "Ops!")
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="text-gray-500 font-medium">Carregando passeio...</span>
    </div>
  );

  if (error || !booking) return (
    <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <p className="text-red-500 mb-4 font-semibold">Erro: {error || "Passeio não encontrado"}</p>
        <button 
          onClick={() => window.location.href = createPageUrl('MyBookings')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition"
        >
          Voltar para Reservas
        </button>
    </div>
  );

  const isWalker = currentUser?.email === booking.walker_email;
  const targetWalkerId = booking.walker_id || booking.walker?.id;

  return (
    // LAYOUT FLEX COLUNA - TRAVADO NA TELA (H-SCREEN FIXO)
    <div className="flex flex-col h-[100vh] w-full bg-white overflow-hidden">
      
      {/* A. CABEÇALHO (50px) */}
      <div className="h-[50px] bg-white border-b flex items-center justify-between px-3 shrink-0 z-30 shadow-sm relative">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-bold text-gray-600 flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="font-semibold text-sm truncate max-w-[60%] text-gray-800">
            {isWalker ? `Cliente: ${booking.owner_name}` : `Passeador: ${booking.walker_name}`}
        </span>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* B. MAPA (35% da tela) - Altura Rígida */}
      <div className="h-[35vh] w-full relative z-10 bg-gray-100 border-b-4 border-blue-500 box-border">
         {/* Container relativo com tamanho definido para o Leaflet */}
         <div className="w-full h-full relative">
           <LiveWalkMap 
              bookingId={bookingId} 
              walkerId={targetWalkerId} 
              className="w-full h-full"
           />
         </div>
      </div>

      {/* C. BARRA DE CONTROLE (Só aparece para Walker) */}
      {isWalker && (
        <div className="bg-blue-50 border-b border-blue-100 p-0 shrink-0 z-20 shadow-md">
             {/* Componente WalkerGPSButton já contém a lógica e UI do botão */}
             <WalkerGPSButton 
                bookingId={bookingId} 
                currentBooking={booking}
                className="w-full flex justify-center py-3"
             />
        </div>
      )}

      {/* D. CHAT (Resto da tela) */}
      <div className="flex-1 w-full relative overflow-hidden bg-gray-50 flex flex-col">
        <ChatWindow 
            bookingId={bookingId} 
            currentUser={currentUser}
            embedded={true} 
        />
      </div>
    </div>
  );
}