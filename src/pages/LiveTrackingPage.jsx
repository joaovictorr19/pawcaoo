import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveWalkMap from '@/components/tracking/LiveWalkMap';
import ChatWindow from '@/components/chat/ChatWindow';
import WalkerGPSButton from '@/components/tracking/WalkerGPSButton';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronLeft, MapPin } from 'lucide-react';
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function LiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Extração robusta do ID
  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = id || searchParams.get('id') || searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map-only', 'chat-only'

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
           // Tenta redirecionar para login se não logado
           base44.auth.redirectToLogin(window.location.href);
           return;
        }
        setCurrentUser(user);

        if (!bookingId) throw new Error("ID da reserva ausente.");
        
        const data = await base44.entities.Booking.filter({ id: bookingId });
        if (!data || data.length === 0) throw new Error("Reserva não encontrada.");

        setBooking(data[0]);
      } catch (err) {
        console.error("Erro ao carregar página de rastreamento:", err);
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId]);

  if (loading) return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">Conectando ao passeio...</p>
    </div>
  );

  if (error || !booking) return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <MapPin className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
        <p className="text-red-600 mb-6">{error || "Não foi possível carregar os dados do passeio."}</p>
        <Button 
          onClick={() => window.location.href = createPageUrl('MyBookings')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full"
        >
          Voltar para Minhas Reservas
        </Button>
    </div>
  );

  const isWalker = currentUser?.email === booking.walker_email;
  const targetWalkerId = booking.walker_id || booking.walker?.id;

  // ESTILOS INLINE PARA GARANTIR O LAYOUT (Salva-vidas contra CSS global quebrado)
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh', // Dynamic viewport height para mobile
    width: '100vw',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#fff',
    zIndex: 9999 // Garante que fica por cima de tudo
  };

  const headerStyle = {
    height: '50px',
    flexShrink: 0,
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    backgroundColor: '#fff',
    zIndex: 50
  };

  const mapContainerStyle = {
    height: viewMode === 'map-only' ? 'calc(100dvh - 50px)' : '35vh',
    width: '100%',
    position: 'relative',
    transition: 'height 0.3s ease',
    flexShrink: 0,
    display: viewMode === 'chat-only' ? 'none' : 'block',
    borderBottom: '4px solid #3b82f6',
    zIndex: 40
  };

  const controlsStyle = {
    flexShrink: 0,
    padding: '8px',
    backgroundColor: '#eff6ff', // blue-50
    borderBottom: '1px solid #dbeafe',
    zIndex: 45
  };

  const chatContainerStyle = {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    display: viewMode === 'map-only' ? 'none' : 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    zIndex: 30
  };

  return (
    <div style={containerStyle}>
      
      {/* 1. HEADER */}
      <div style={headerStyle}>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 font-bold text-sm p-2 -ml-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>
        
        <div className="flex-1 text-center truncate px-2">
          <span className="font-semibold text-gray-800 text-sm">
            {isWalker ? `Cliente: ${booking.owner_name}` : `Passeador: ${booking.walker_name}`}
          </span>
          <div className="text-[10px] text-green-600 font-medium flex items-center justify-center gap-1">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
             Em tempo real
          </div>
        </div>

        {/* View Toggle (Mobile UX) */}
        <button 
          onClick={() => setViewMode(prev => prev === 'split' ? 'map-only' : 'split')}
          className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"
        >
          {viewMode === 'split' ? 'Expandir Mapa' : 'Dividir Tela'}
        </button>
      </div>

      {/* 2. MAPA */}
      <div style={mapContainerStyle}>
         <div style={{ width: '100%', height: '100%', position: 'relative' }}>
           <LiveWalkMap 
              bookingId={bookingId} 
              walkerId={targetWalkerId} 
              className="w-full h-full block"
           />
         </div>
      </div>

      {/* 3. CONTROLES (WALKER APENAS) */}
      {isWalker && viewMode !== 'map-only' && (
        <div style={controlsStyle}>
           <WalkerGPSButton 
              bookingId={bookingId} 
              currentBooking={booking}
              className="w-full flex justify-center" // Remove absolute positioning
           />
        </div>
      )}

      {/* 4. CHAT */}
      <div style={chatContainerStyle}>
        <ChatWindow 
            bookingId={bookingId} 
            currentUser={currentUser}
            embedded={true} 
        />
      </div>

    </div>
  );
}