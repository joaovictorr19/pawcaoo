import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveWalkMap from '@/components/tracking/LiveWalkMap';
import ChatWindow from '@/components/chat/ChatWindow';
import WalkerGPSButton from '@/components/tracking/WalkerGPSButton';
import ClientGPSButton from '@/components/tracking/ClientGPSButton';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { createPageUrl } from "@/utils";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. Extração de ID à prova de falhas
  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = id || searchParams.get('id') || searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
           base44.auth.redirectToLogin(window.location.href);
           return;
        }
        setCurrentUser(user);

        if (!bookingId) throw new Error("ID da reserva ausente na URL.");
        
        // Busca exata pelo ID
        const data = await base44.entities.Booking.filter({ id: bookingId });
        if (!data || data.length === 0) throw new Error("Reserva não encontrada no sistema.");

        setBooking(data[0]);
      } catch (err) {
        console.error("Critical Error LiveTracking:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId]);

  if (loading) return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <span className="text-gray-500 font-medium">Sincronizando passeio...</span>
    </div>
  );

  if (error || !booking) return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Falha ao Carregar</h3>
        <p className="text-gray-600 mt-2 mb-6">{error || "Não foi possível acessar os dados."}</p>
        <button 
          onClick={() => window.location.href = createPageUrl('MyBookings')}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium"
        >
          Voltar para Minhas Reservas
        </button>
    </div>
  );

  // 2. Lógica de Identificação (Case Insensitive para segurança)
  const userEmail = currentUser?.email?.toLowerCase() || "";
  const walkerEmail = booking.walker_email?.toLowerCase() || "";
  const ownerEmail = booking.owner_email?.toLowerCase() || "";

  const isWalker = userEmail === walkerEmail;
  const isClient = userEmail === ownerEmail;

  // Se não for nenhum dos dois (ex: admin ou erro), trata como cliente (apenas vê)
  const userRole = isWalker ? 'walker' : 'client';

  // 3. LAYOUT GRID INQUEBRÁVEL
  // Define linhas fixas: Header (60px), Mapa (35%), Action Bar (Auto), Chat (Resto)
  const gridStyle = {
    display: 'grid',
    gridTemplateRows: '60px 35fr auto 65fr', // Proporção 35% Mapa / 65% Chat
    height: '100dvh', // Altura real do dispositivo
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: 9999
  };

  return (
    <div style={gridStyle}>
      
      {/* AREA 1: HEADER (Fixo 60px) */}
      <header className="border-b border-gray-200 bg-white flex items-center justify-between px-4 z-50">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
            {isWalker ? booking.owner_name : booking.walker_name}
          </h1>
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">
            ● Ao Vivo
          </p>
        </div>
        <div className="w-8"></div> {/* Spacer p/ centralizar */}
      </header>

      {/* AREA 2: MAPA (35% da altura) */}
      <div className="relative w-full bg-gray-100 border-b-4 border-blue-500 z-40 overflow-hidden">
         {/* Forçamos o mapa a preencher absolutamente este container de grade */}
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LiveWalkMap 
              bookingId={booking.id} 
              walkerId={booking.walker_id} 
              className="w-full h-full"
            />
         </div>
      </div>

      {/* AREA 3: BARRA DE AÇÃO (Auto height - se expande conforme conteúdo) */}
      <div className="bg-white border-b border-gray-200 p-3 z-30 shadow-sm">
        {isWalker && (
           <WalkerGPSButton 
             bookingId={booking.id} 
             currentBooking={booking}
             className="w-full" // Passa full width
           />
        )}
        
        {isClient && (
           <ClientGPSButton 
             bookingId={booking.id}
           />
        )}

        {!isWalker && !isClient && (
           <div className="text-center text-xs text-gray-400 py-2">
             Modo Espectador
           </div>
        )}
      </div>

      {/* AREA 4: CHAT (Ocupa o resto) */}
      <div className="relative w-full bg-slate-50 overflow-hidden z-20">
         {/* Container absoluto interno para garantir scroll correto */}
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <ChatWindow 
               bookingId={booking.id} 
               currentUser={currentUser}
               embedded={true} 
            />
         </div>
      </div>

    </div>
  );
}