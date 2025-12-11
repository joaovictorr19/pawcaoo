import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Navigation, MapPin, ArrowLeft, CheckCircle, Maximize2, Minimize2, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ========== CORREÇÃO DOS ÍCONES LEAFLET ==========
// Fix: Ícones padrão não carregam (404)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícones Personalizados
const dogIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  className: "drop-shadow-xl"
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ========== MAP AUTO-CENTER ==========
function MapUpdater({ path, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    } else if (path && path.length > 0) {
      const last = path[path.length - 1];
      map.setView([last.lat, last.lng], map.getZoom(), { animate: true });
    }
  }, [path, userLocation, map]);

  if (!path || path.length === 0) return null;

  const positions = path.map(p => [p.lat, p.lng]);
  const current = path[path.length - 1];

  return (
    <>
      <Polyline 
        positions={positions} 
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, lineCap: 'round' }} 
      />
      {path.length > 1 && <Marker position={[path[0].lat, path[0].lng]} icon={startIcon} />}
      <Marker position={[current.lat, current.lng]} icon={dogIcon} />
    </>
  );
}

// ========== MAIN COMPONENT ==========
export default function ChatWindow({ bookingId, booking, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const watchIdRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Contexto do Usuário
  const isWalker = currentUser.email === booking.walker_email;
  const otherEmail = isWalker ? (booking.owner_email || booking.created_by) : booking.walker_email;
  const otherName = isWalker ? booking.owner_name : booking.walker_name;

  // ========== CONVERSATION LOGIC ==========
  const { data: conversation, refetch: refetchConv } = useQuery({
    queryKey: ['chatConversation', bookingId],
    queryFn: async () => {
      const res = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      if (res[0]) return res[0];

      // Criar se não existir
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
  });

  const conversationId = conversation?.id;

  // ========== MESSAGES ==========
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await base44.entities.ChatMessage.filter({ conversation_id: conversationId }, '-created_date', 100);
    },
    enabled: !!conversationId,
    refetchInterval: 2000
  });

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ========== SEND MESSAGE ==========
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

  // ========== GPS TRACKING ==========
  const startGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS não suportado");
      return;
    }

    setIsTracking(true);
    toast.success("📡 GPS Ativado");
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
            distance_km: ((updatedRoute.length * 0.01) || 0).toFixed(2)
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

  // ========== FINALIZE ==========
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

  // ========== "ONDE ESTOU?" ==========
  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error("GPS não disponível");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        toast.success("📍 Localização obtida");
      },
      () => toast.error("Erro ao obter localização")
    );
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ========== MAP DATA ==========
  const path = booking.route_coordinates || [];
  const center = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : path.length > 0 
      ? [path[path.length - 1].lat, path[path.length - 1].lng] 
      : [38.7223, -9.1393];
  
  const showMap = booking.status === 'in_progress' || booking.status === 'service_completed' || booking.status === 'confirmed';

  // ========== LAYOUT RENDER ==========
  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-white">
      
      {/* ========== COLUNA ESQUERDA: CHAT (Desktop 40%) ========== */}
      <div className={`flex flex-col bg-white ${mapExpanded ? 'hidden md:flex' : 'flex-1'} md:w-[40%] md:h-full md:flex-none md:border-r md:border-gray-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ProfessionalDashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="h-10 w-10 border-2 border-gray-100">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
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
            {isWalker && booking.status === 'confirmed' && (
              <Button 
                size="sm" 
                onClick={startGPS}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                INICIAR PASSEIO
              </Button>
            )}
            {isWalker && booking.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => finalizeMutation.mutate()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                FINALIZAR
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
          {sortedMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
              Início da conversa. Diga olá! 👋
            </div>
          )}
          {sortedMessages.map((msg) => {
            const isMe = msg.sender_email === currentUser.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-2">
                    {new Date(msg.created_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
          {booking.status === 'completed' || booking.status === 'service_completed' ? (
            <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
              ✅ Passeio concluído - Chat arquivado
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2 items-center bg-gray-50 p-2 rounded-full border border-gray-200">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-4"
                disabled={sendMutation.isPending || !conversationId}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!message.trim() || sendMutation.isPending || !conversationId}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 shadow-md"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* ========== COLUNA DIREITA: MAPA (Desktop 60% | Mobile Widget Topo) ========== */}
      {showMap && (
        <div className={`relative bg-gray-100 shrink-0 ${mapExpanded ? 'fixed inset-0 z-50' : 'h-[35vh] md:h-full md:w-[60%]'}`}>
          <MapContainer 
            center={center} 
            zoom={16} 
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <MapUpdater path={path} userLocation={userLocation} />
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} />
            )}
          </MapContainer>

          {/* Overlay Info */}
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold text-gray-700 z-[1000]">
            {booking.status === 'in_progress' ? '🟢 Em Andamento' : '📍 Mapa'}
          </div>

          {booking.distance_km && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg text-xs font-mono z-[1000]">
              {booking.distance_km} km
            </div>
          )}

          {/* Botão "Onde Estou?" */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Button
              onClick={locateMe}
              size="sm"
              variant="outline"
              className="bg-white shadow-lg"
            >
              <Crosshair className="w-4 h-4 mr-2" />
              Onde Estou?
            </Button>
          </div>

          {/* Botão Expandir/Minimizar (Mobile) */}
          <div className="absolute bottom-4 right-4 z-[1000] md:hidden">
            <Button
              onClick={() => setMapExpanded(!mapExpanded)}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl rounded-full"
            >
              {mapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* GPS Controls (Walker) */}
          {isWalker && booking.status === 'confirmed' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] hidden md:block">
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
            <div className="absolute bottom-20 right-4 z-[1000]">
              <Button
                onClick={stopGPS}
                variant="outline"
                className="bg-white shadow-lg border-2 border-red-500 text-red-600"
              >
                🔴 Pausar GPS
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}