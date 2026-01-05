import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  MessageCircle, 
  AlertTriangle, 
  Camera, 
  Droplets,
  Send,
  CheckCircle,
  Clock,
  Navigation,
  Coffee,
  Zap,
  AlertCircle
} from "lucide-react";
import { Map, MapRoute, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from "@/utils";

export default function ActiveWalkDashboard() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch booking
  const { data: booking, isLoading } = useQuery({
    queryKey: ['activeBooking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: !!bookingId,
    refetchInterval: 5000,
  });

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery({
    queryKey: ['walkCheckpoints', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const cps = await base44.entities.WalkCheckpoint.filter({ booking_id: bookingId }, 'created_date');
      return cps;
    },
    enabled: !!bookingId,
    refetchInterval: 3000,
  });

  // Fetch chat conversation
  const { data: conversation } = useQuery({
    queryKey: ['bookingConversation', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const convos = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      return convos[0] || null;
    },
    enabled: !!bookingId,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, 'created_date');
      return msgs.filter(m => !m.is_deleted);
    },
    enabled: !!conversation?.id,
    refetchInterval: 2000,
  });

  const unreadCount = messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email)).length;

  // Start GPS tracking
  useEffect(() => {
    if (booking?.status === 'in_progress' && navigator.geolocation && !isTracking) {
      console.log('🚀 Starting GPS tracking...');
      setIsTracking(true);
      startTimeRef.current = booking.walk_start_time ? new Date(booking.walk_start_time) : new Date();

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setCurrentPosition(newPos);

          // Update booking location
          base44.entities.Booking.update(bookingId, {
            walker_lat: newPos.lat,
            walker_lng: newPos.lng,
            last_update: newPos.timestamp,
            route_coordinates: [...(booking.route_coordinates || []), newPos]
          }).catch(err => console.error('Location update error:', err));
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [booking?.status, bookingId, isTracking]);

  // Timer
  useEffect(() => {
    if (booking?.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const start = startTimeRef.current || new Date();
      const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking?.status]);

  // Calculate distance
  useEffect(() => {
    if (booking?.route_coordinates && booking.route_coordinates.length > 1) {
      const coords = booking.route_coordinates;
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        total += calculateDistance(
          coords[i - 1].lat, coords[i - 1].lng,
          coords[i].lat, coords[i].lng
        );
      }
      setDistanceKm(total);
    }
  }, [booking?.route_coordinates]);

  // Distance calculation (Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Create checkpoint mutation
  const createCheckpointMutation = useMutation({
    mutationFn: async (checkpointData) => {
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: checkpointData.type,
        photo_url: checkpointData.photo_url,
        latitude: currentPosition?.lat,
        longitude: currentPosition?.lng,
        timestamp: new Date().toISOString(),
        notes: checkpointData.notes,
      });

      // Send message to chat
      if (conversation?.id) {
        await base44.entities.ChatMessage.create({
          conversation_id: conversation.id,
          sender_email: user.email,
          sender_name: user.full_name || 'Passeador',
          participants: conversation.participants,
          content: checkpointData.message,
          message_type: 'checkpoint',
        });

        await base44.entities.ChatConversation.update(conversation.id, {
          last_message: checkpointData.message,
          last_message_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['walkCheckpoints']);
      queryClient.invalidateQueries(['chatMessages']);
      toast.success('Evento registado!');
    },
  });

  // Send status message mutation
  const sendStatusMutation = useMutation({
    mutationFn: async (message) => {
      if (!conversation?.id) return;
      
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: user.full_name || 'Passeador',
        participants: conversation.participants,
        content: message,
        message_type: 'status',
      });

      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: message,
        last_message_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
      setShowStatusMenu(false);
      toast.success('Status enviado!');
    },
  });

  // Handle quick event
  const handleQuickEvent = (type, icon, message) => {
    if (!currentPosition) {
      toast.error('Aguarde GPS...');
      return;
    }

    createCheckpointMutation.mutate({
      type,
      message: `${icon} ${message}`,
      notes: `GPS: ${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`
    });
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info('A carregar foto...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      createCheckpointMutation.mutate({
        type: 'photo_update',
        photo_url: file_url,
        message: `📷 Nova foto enviada!`,
      });
    } catch (error) {
      toast.error('Erro ao carregar foto');
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4" />
          <p>A carregar painel de controlo...</p>
        </div>
      </div>
    );
  }

  if (booking.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Passeio Não Iniciado</h2>
          <p className="text-gray-600 mb-4">Este passeio ainda não começou ou já foi concluído.</p>
          <Button onClick={() => navigate(createPageUrl('MyBookings'))}>
            Ver Minhas Reservas
          </Button>
        </Card>
      </div>
    );
  }

  const routeCoordinates = booking.route_coordinates?.map(c => [c.lng, c.lat]) || [];
  const mapCenter = currentPosition 
    ? [currentPosition.lng, currentPosition.lat]
    : booking.pickup_lng && booking.pickup_lat
    ? [booking.pickup_lng, booking.pickup_lat]
    : [-8.6291, 41.1579];

  const statusOptions = [
    { icon: '😰', label: 'Cão Agitado/Agressivo', message: '⚠️ O cão está agitado/agressivo no momento' },
    { icon: '🤢', label: 'Não se sente bem', message: '🤢 O cão não está se sentindo bem' },
    { icon: '💧', label: 'Paragem para Água', message: '💧 Paragem para dar água' },
    { icon: '🐕', label: 'Brincando com outros cães', message: '🐕 A brincar com outros cães!' },
    { icon: '🎾', label: 'Hora de Brincar', message: '🎾 Hora de brincar!' },
    { icon: '😴', label: 'Cão Cansado', message: '😴 O cão está cansado, vamos descansar' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <Map center={mapCenter} zoom={15}>
          {/* Route Line */}
          {routeCoordinates.length > 1 && (
            <MapRoute
              coordinates={routeCoordinates}
              color="#3b82f6"
              width={4}
              opacity={0.8}
            />
          )}

          {/* Pickup Location */}
          {booking.pickup_lat && booking.pickup_lng && (
            <MapMarker longitude={booking.pickup_lng} latitude={booking.pickup_lat}>
              <MarkerContent>
                <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl">
                  🏠
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Current Walker Position */}
          {currentPosition && (
            <MapMarker longitude={currentPosition.lng} latitude={currentPosition.lat}>
              <MarkerContent>
                <div className="relative">
                  <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-25 animate-ping" />
                  <div className="w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Event Markers */}
          {checkpoints.map((cp, idx) => {
            if (!cp.latitude || !cp.longitude) return null;
            const icon = cp.checkpoint_type === 'photo_update' ? '📷' :
                        cp.checkpoint_type === 'behavior_note' ? '💩' : '📍';
            return (
              <MapMarker key={cp.id} longitude={cp.longitude} latitude={cp.latitude}>
                <MarkerContent>
                  <div className="w-8 h-8 bg-white rounded-full border-2 border-purple-500 shadow-md flex items-center justify-center text-lg">
                    {icon}
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}

          <MapControls position="top-right" showZoom showLocate />
        </Map>
      </div>

      {/* Top Bar - Stats Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/70 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-lg">
            <Navigation className="w-5 h-5 text-green-600" />
            <span className="font-bold text-lg text-gray-900">{distanceKm.toFixed(2)} km</span>
          </div>

          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl px-6"
            onClick={() => {
              if (confirm('⚠️ ATIVAR MODO EMERGÊNCIA?\n\nIsto notificará o dono e a plataforma imediatamente.')) {
                toast.error('🚨 EMERGÊNCIA ATIVADA!');
                // Create emergency notification
                base44.entities.Notification.create({
                  recipient_email: booking.created_by,
                  title: '🚨 EMERGÊNCIA NO PASSEIO',
                  message: `O passeador ${user.full_name} ativou o modo emergência!`,
                  type: 'emergency',
                  priority: 'urgent',
                  related_id: bookingId,
                });
              }
            }}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            AJUDA
          </Button>
        </div>
      </div>

      {/* Bottom Control Deck */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Dog Info Card */}
          <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-2xl">
                  🐕
                </div>
                <div>
                  <h3 className="font-bold text-lg">{booking.dog_name}</h3>
                  <p className="text-sm text-gray-600">{booking.owner_name}</p>
                </div>
              </div>
              <Badge className="bg-green-600 text-white">EM ANDAMENTO</Badge>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickEvent('behavior_note', '💩', 'O cão fez cocô!')}
              className="aspect-square bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transition-all"
              disabled={createCheckpointMutation.isPending}
            >
              <span className="text-4xl mb-1">💩</span>
              <span className="text-xs font-bold">Cocô</span>
            </button>

            <button
              onClick={() => handleQuickEvent('behavior_note', '💧', 'O cão fez xixi!')}
              className="aspect-square bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transition-all"
              disabled={createCheckpointMutation.isPending}
            >
              <span className="text-4xl mb-1">💧</span>
              <span className="text-xs font-bold">Xixi</span>
            </button>

            <label className="aspect-square bg-purple-500 hover:bg-purple-600 active:scale-95 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transition-all cursor-pointer">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowStatusMenu(true)}
              className="aspect-square bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transition-all"
            >
              <Zap className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">Status</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 bg-white text-gray-900 hover:bg-gray-100 shadow-xl relative"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-xl"
              onClick={() => navigate(createPageUrl(`ActiveRide?bookingId=${bookingId}`))}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finalizar Passeio
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Sheet */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="bottom" className="h-[70vh] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Chat com {booking.owner_name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 h-[calc(70vh-80px)]">
            {messages.map((msg) => {
              const isMine = msg.sender_email === user?.email;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Status Menu Sheet */}
      <Sheet open={showStatusMenu} onOpenChange={setShowStatusMenu}>
        <SheetContent side="bottom" className="h-auto p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Enviar Status Rápido</SheetTitle>
          </SheetHeader>
          <div className="p-4 grid grid-cols-2 gap-3">
            {statusOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => sendStatusMutation.mutate(option.message)}
                className="p-4 bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-xl transition-all active:scale-95"
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{option.label}</div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}