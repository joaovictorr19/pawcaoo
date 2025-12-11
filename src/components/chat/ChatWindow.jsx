import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Navigation, MapPin, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * CHAT WINDOW - REESCRITO DO ZERO
 * Arquitetura: Data Integrity → Layout Híbrido → Lógica de Negócio
 */

// ========== MAPA CONFIG ==========
const dogIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Auto-center map on new coordinates
function MapUpdater({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      const last = path[path.length - 1];
      map.setView([last.lat, last.lng], map.getZoom(), { animate: true });
    }
  }, [path, map]);

  if (!path || path.length === 0) return null;

  const positions = path.map(p => [p.lat, p.lng]);
  const current = path[path.length - 1];

  return (
    <>
      <Polyline 
        positions={positions} 
        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }} 
      />
      {path.length > 1 && <Marker position={[path[0].lat, path[0].lng]} icon={startIcon} />}
      <Marker position={[current.lat, current.lng]} icon={dogIcon} />
    </>
  );
}

// ========== MAIN COMPONENT ==========
export default function ChatWindow({ bookingId, conversationId: propConvId, booking: propBooking, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const watchIdRef = useRef(null);

  const [message, setMessage] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0);

  // ========== 1. DATA INTEGRITY ==========
  // Fetch or use provided booking
  const { data: booking } = useQuery({
    queryKey: ['chatBooking', bookingId],
    queryFn: async () => {
      const res = await base44.entities.Booking.filter({ id: bookingId });
      return res[0];
    },
    enabled: !!bookingId && !propBooking,
    initialData: propBooking,
    refetchInterval: 5000
  });

  if (!booking) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Carregando dados do passeio...</p>
      </div>
    );
  }

  // Contexto
  const isWalker = currentUser.email === booking.walker_email;
  const isClient = currentUser.email === (booking.owner_email || booking.created_by);
  const otherEmail = isWalker ? (booking.owner_email || booking.created_by) : booking.walker_email;
  const otherName = isWalker ? booking.owner_name : booking.walker_name;

  console.group("🔍 CHAT DEBUG");
  console.table({
    BookingID: bookingId,
    WalkerEmail: booking.walker_email,
    ClientEmail: booking.owner_email || booking.created_by,
    Status: booking.status,
    IsWalker: isWalker,
    IsClient: isClient
  });
  console.groupEnd();

  // ========== 2. CONVERSATION LOGIC ==========
  const { data: conversation, refetch: refetchConv } = useQuery({
    queryKey: ['chatConversation', bookingId, propConvId],
    queryFn: async () => {
      // Try by ID first
      if (propConvId) {
        const res = await base44.entities.ChatConversation.filter({ id: propConvId });
        if (res[0]) return res[0];
      }

      // Try by booking_id
      if (bookingId) {
        const res = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
        if (res[0]) return res[0];

        // Create if not exists
        console.log("📝 Criando nova conversa para booking:", bookingId);
        const newConv = await base44.entities.ChatConversation.create({
          booking_id: bookingId,
          participants: [currentUser.email, otherEmail],
          tags: ['booking'],
          last_message: 'Conversa iniciada',
          last_message_date: new Date().toISOString(),
          unread_counts: { [currentUser.email]: 0, [otherEmail]: 0 }
        });
        return newConv;
      }
      return null;
    },
    enabled: !!bookingId || !!propConvId
  });

  const conversationId = conversation?.id;

  // ========== 3. MESSAGES ==========
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await base44.entities.ChatMessage.filter({ conversation_id: conversationId }, '-created_date', 100);
    },
    enabled: !!conversationId,
    refetchInterval: 2000
  });

  // Sort chronologically
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ========== 4. SEND MESSAGE ==========
  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!conversationId) throw new Error("Conversa não inicializada");

      await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        booking_id: bookingId,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email.split('@')[0],
        content,
        timestamp: new Date().toISOString()
      });

      await base44.entities.ChatConversation.update(conversationId, {
        last_message: content,
        last_message_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries(['chatMessages']);
    },
    onError: () => toast.error("Erro ao enviar mensagem")
  });

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  // ========== 5. GPS TRACKING (WALKER ONLY) ==========
  const startGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS não suportado");
      return;
    }

    setIsTracking(true);
    toast.success("📡 GPS Ativado - Cliente a ver localização");

    // Update status to in_progress
    base44.entities.Booking.update(bookingId, { status: 'in_progress' });

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

        try {
          const fresh = await base44.entities.Booking.filter({ id: bookingId });
          const current = fresh[0];
          const updatedRoute = [...(current?.route_coordinates || []), newPoint];

          await base44.entities.Booking.update(bookingId, {
            route_coordinates: updatedRoute,
            distance_km: ((updatedRoute.length * 0.01) || 0).toFixed(2) // Simplified distance
          });

          queryClient.invalidateQueries(['chatBooking']);
        } catch (err) {
          console.error("GPS update error:", err);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        toast.error("Erro ao acessar localização");
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopGPS = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info("GPS Pausado");
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ========== 6. FINALIZE WALK ==========
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Booking.update(bookingId, { status: 'service_completed' });
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setIsTracking(false);
    },
    onSuccess: () => {
      toast.success("✅ Passeio Finalizado!");
      queryClient.invalidateQueries(['chatBooking']);
    }
  });

  // ========== 7. MAP LOGIC ==========
  const path = booking.route_coordinates || [];
  const center = path.length > 0 ? [path[path.length - 1].lat, path[path.length - 1].lng] : [38.7223, -9.1393];
  const showMap = booking.status === 'in_progress' || booking.status === 'service_completed';

  // ========== 8. LAYOUT RENDERING ==========
  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden">
      
      {/* ========== MOBILE: MAPA TOPO (35vh) | DESKTOP: ESQUERDA (60%) ========== */}
      {showMap && (
        <div className="h-[35vh] md:h-full md:w-[60%] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 relative">
          <MapContainer 
            center={center} 
            zoom={16} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <MapUpdater path={path} />
          </MapContainer>

          {/* Overlay Info */}
          <div className="absolute top-2 left-2 right-2 z-[1000] flex justify-between items-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs font-bold text-gray-700 pointer-events-auto">
              {booking.status === 'in_progress' ? '🟢 Em Andamento' : '✅ Concluído'}
            </div>
            <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs font-mono pointer-events-auto">
              {booking.distance_km || 0} km
            </div>
          </div>

          {/* GPS Button - Walker Only */}
          {isWalker && booking.status === 'confirmed' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
              <Button
                onClick={startGPS}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-xl px-6"
              >
                <Navigation className="w-5 h-5 mr-2" />
                📍 ATIVAR GPS
              </Button>
            </div>
          )}

          {isWalker && isTracking && (
            <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto">
              <Button
                onClick={stopGPS}
                variant="outline"
                className="bg-white shadow-lg"
              >
                🔴 Pausar GPS
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========== CHAT AREA (DIREITA) ========== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white md:w-[40%]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ProfessionalDashboard')}
              className="md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gray-100 text-gray-700">
                {(otherName || otherEmail)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-sm">{otherName || otherEmail.split('@')[0]}</h3>
              <p className="text-xs text-gray-500">{isWalker ? 'Cliente' : 'Passeador'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isWalker && booking.status === 'confirmed' && !isTracking && (
              <Button 
                size="sm" 
                onClick={startGPS}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                INICIAR PASSEIO
              </Button>
            )}
            {isWalker && booking.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => finalizeMutation.mutate()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                FINALIZAR
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {sortedMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
              Início da conversa. Diga olá! 👋
            </div>
          )}
          {sortedMessages.map((msg) => {
            const isMe = msg.sender_email === currentUser.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-3 py-2 rounded-xl text-sm shadow ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">
                    {new Date(msg.created_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t shrink-0">
          {booking.status === 'completed' || booking.status === 'service_completed' ? (
            <div className="text-center py-2 text-gray-500 text-sm">
              ✅ Passeio concluído - Chat arquivado
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="flex-1"
                disabled={sendMutation.isPending || !conversationId}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!message.trim() || sendMutation.isPending || !conversationId}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}