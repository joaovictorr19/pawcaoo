import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveWalkMap from '../components/tracking/LiveWalkMap';
import ChatWindow from '../components/chat/ChatWindow';
import WalkerGPSButton from '../components/tracking/WalkerGPSButton';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  // Support both route param and query param
  const bookingId = id || searchParams.get('id') || searchParams.get('bookingId');
  
  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Pega usuário
        const user = await base44.auth.me();
        if (!user) {
          // Could redirect to login, but for now just stop
          setLoading(false);
          return; 
        }
        setCurrentUser(user);

        // 2. Pega reserva
        if (bookingId) {
          const data = await base44.entities.Booking.filter({ id: bookingId });
          if (data && data.length > 0) {
            setBooking(data[0]);
          }
        }
      } catch (err) {
        console.error("Error loading LiveTrackingPage data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookingId]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      <span className="text-gray-500">Carregando passeio...</span>
    </div>
  );

  if (!booking) return (
    <div className="flex h-screen items-center justify-center text-red-500 bg-gray-50 p-4 text-center">
      Passeio não encontrado ou ID inválido.
    </div>
  );

  const isWalker = currentUser?.email === booking.walker_email;
  const targetWalkerId = booking.walker_id || booking.walker?.id;

  return (
    // CONTAINER MESTRE - H-SCREEN FIXO
    <div className="flex flex-col h-[100vh] w-full bg-white overflow-hidden">
      
      {/* 1. CABEÇALHO DE NAVEGAÇÃO (Fixo) */}
      <div className="h-14 bg-white border-b flex items-center px-4 justify-between shadow-sm z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-600 font-bold flex items-center gap-1 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Voltar
        </button>
        <span className="font-semibold text-gray-800 truncate px-2">
            {isWalker ? "Minha Caminhada" : "Acompanhando Passeio"}
        </span>
        <div className="w-16"></div> {/* Espaçador para balancear o botão de voltar */}
      </div>

      {/* 2. ÁREA DO MAPA (30% da tela) */}
      <div className="h-[30vh] min-h-[250px] w-full relative border-b border-gray-300 z-10 shrink-0">
        <LiveWalkMap 
          bookingId={bookingId} 
          walkerId={targetWalkerId} 
          className="w-full h-full"
        />
      </div>

      {/* 3. BARRA DE AÇÃO (Destaque para o GPS - Apenas Walker) */}
      {isWalker && (
        <div className="bg-blue-50 p-3 flex items-center justify-center border-b border-blue-100 z-20 shrink-0">
             {/* Passamos className para o WalkerGPSButton para ele não usar absolute positioning */}
             <WalkerGPSButton 
                bookingId={bookingId} 
                currentBooking={booking}
                className="w-full max-w-md flex justify-center"
             />
        </div>
      )}

      {/* 4. ÁREA DO CHAT (Resto da tela) */}
      <div className="flex-1 w-full relative bg-gray-50 overflow-hidden flex flex-col">
        <ChatWindow 
          bookingId={bookingId} 
          currentUser={currentUser}
          embedded={true} 
        />
      </div>

    </div>
  );
}