import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  MessageCircle, 
  AlertTriangle, 
  Camera, 
  Clock,
  Navigation,
  CheckCircle,
  Thermometer,
  Frown
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { MarkerTooltip, MarkerPopup } from "@/components/ui/map";
import UniversalMap from "@/components/maps/UniversalMap";
import SafeMapWrapper from "@/components/maps/SafeMapWrapper";
import { MapRoute, MapMarker, MarkerContent } from "@/components/ui/map";
import maplibregl from 'maplibre-gl';
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { WalkScanner } from "@/components/booking/WalkScanner";

export default function ActiveServiceCockpit({ bookingId, user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const pendingPositionRef = useRef(null);
  const [pathMarkers, setPathMarkers] = useState([]);
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);

  // Fetch booking
  const { data: booking, error } = useQuery({
    queryKey: ['activeBooking', bookingId],
    queryFn: async () => {
      console.log('🔍 [COCKPIT] Fetching booking:', bookingId);
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      console.log('📦 [COCKPIT] Found bookings:', bookings?.length || 0);
      
      if (!bookings || bookings.length === 0) {
        throw new Error('Reserva não encontrada');
      }
      
      return bookings[0];
    },
    enabled: !!bookingId,
    refetchInterval: 2000,
  });

  // SECURITY: Admin Bypass - Admins can view any service
  useEffect(() => {
    if (!booking || !user) return;

    const isOwner = booking.owner_email === user.email || booking.created_by === user.email;
    const isWalker = booking.walker_email === user.email;
    const isAdmin = user.role === 'admin';

    console.log('🔐 [COCKPIT] Security check:', { isOwner, isWalker, isAdmin, userRole: user.role });

    if (!isOwner && !isWalker && !isAdmin) {
      console.error('❌ [COCKPIT] Access denied');
      toast.error('Acesso negado: Não é participante desta reserva');
      navigate(createPageUrl('Home'));
    } else {
      console.log('✅ [COCKPIT] Access granted');
    }
  }, [booking, user, navigate]);

  // Fetch conversation with auto-create
  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['bookingConversation', bookingId],
    queryFn: async () => {
      const convos = await base44.entities.ChatConversation.filter({ booking_id: bookingId });
      if (convos && convos.length > 0) {
        return convos[0];
      }
      return null;
    },
    enabled: !!bookingId,
  });

  // Auto-create conversation if missing
  useEffect(() => {
    const createConversation = async () => {
      if (booking && !conversation && user) {
        try {
          console.log('🔄 Creating missing conversation for booking:', bookingId);
          const walkerEmail = booking.walker_email;
          const ownerEmail = booking.owner_email || booking.created_by;
          
          if (!walkerEmail || !ownerEmail) return;

          const newConvo = await base44.entities.ChatConversation.create({
            participants: [walkerEmail, ownerEmail],
            participant_names: {
              [walkerEmail]: booking.walker_name || 'Walker',
              [ownerEmail]: booking.owner_name || 'Cliente'
            },
            booking_id: bookingId,
            tags: ["booking", "walk"],
            last_message: "Chat iniciado",
            last_message_date: new Date().toISOString(),
            unread_counts: {
              [walkerEmail]: 0,
              [ownerEmail]: 0
            }
          });
          console.log('✅ Conversation created:', newConvo.id);
          refetchConversation();
        } catch (err) {
          console.error('Error creating conversation:', err);
        }
      }
    };
    
    if (booking && conversation === null) {
      createConversation();
    }
  }, [booking, conversation, user, bookingId, refetchConversation]);

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, 'created_date');
      return msgs.filter(m => !m.is_deleted);
    },
    enabled: !!conversation?.id && isChatOpen,
    refetchInterval: isChatOpen ? 2000 : false,
  });

  const unreadCount = React.useMemo(() => {
    if (!messages || !user?.email) return 0;
    return messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email)).length;
  }, [messages, user?.email]);

  // GPS tracking - REAL-TIME with HIGH ACCURACY
  useEffect(() => {
    if (booking?.status === 'in_progress' && navigator.geolocation && !isTracking) {
      console.log('🛰️ Starting GPS tracking...');
      setIsTracking(true);
      startTimeRef.current = booking.walk_start_time ? new Date(booking.walk_start_time) : new Date();

      // Request permission and start tracking
      toast.info('📡 Ativando GPS de alta precisão...', {
        description: 'Aguarde alguns segundos',
        duration: 3000
      });

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          
          console.log('📍 GPS Update:', newPos);
          setCurrentPosition(newPos);
          pendingPositionRef.current = newPos;
          
          // Show success on first position
          if (!currentPosition) {
            toast.success('✅ GPS ativo! Sinal obtido.', {
              description: `Precisão: ${Math.round(newPos.accuracy)}m`,
              duration: 2000
            });
          }
        },
        (error) => {
          console.error('❌ GPS error:', error);
          toast.error('Erro GPS: ' + error.message, {
            description: 'Verifique as permissões do navegador'
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // CRITICAL: Update database with real-time position
      updateIntervalRef.current = setInterval(async () => {
        if (pendingPositionRef.current && booking?.id) {
          const pos = pendingPositionRef.current;
          pendingPositionRef.current = null;

          try {
            console.log('💾 Updating database with position:', pos);
            await base44.entities.Booking.update(bookingId, {
              walker_lat: pos.lat,
              walker_lng: pos.lng,
              last_update: pos.timestamp,
              route_coordinates: [...(booking.route_coordinates || []), pos]
            });
            console.log('✅ Position saved to database');
          } catch (err) {
            console.error('❌ DB update error:', err);
          }
        }
      }, 3000); // Update every 3 seconds
    }

    return () => {
      if (watchIdRef.current) {
        console.log('🛑 Stopping GPS tracking');
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [booking?.status, bookingId, isTracking, booking?.id, booking?.route_coordinates, currentPosition]);

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
        const R = 6371;
        const dLat = (coords[i].lat - coords[i-1].lat) * Math.PI / 180;
        const dLon = (coords[i].lng - coords[i-1].lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coords[i-1].lat * Math.PI / 180) * Math.cos(coords[i].lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        total += R * c;
      }
      setDistanceKm(total);
    }
  }, [booking?.route_coordinates]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: user.full_name || user.email.split("@")[0],
        participants: conversation.participants,
        content: messageData.content,
        message_type: messageData.type || "text",
      });

      const otherParticipants = conversation.participants.filter((p) => p !== user.email);
      const newUnreadCounts = { ...(conversation.unread_counts || {}) };
      otherParticipants.forEach((p) => {
        newUnreadCounts[p] = (newUnreadCounts[p] || 0) + 1;
      });

      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: messageData.content || "📎 Anexo",
        last_message_date: new Date().toISOString(),
        unread_counts: newUnreadCounts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages']);
    },
  });

  // Handle quick event (Poop, Pee, Water, Social)
  const handleQuickEvent = async (emoji, message) => {
    console.log('🎯 handleQuickEvent called:', emoji, message);
    console.log('📍 Current Position:', currentPosition);
    
    if (!currentPosition) {
      toast.error('⏳ Aguarde o sinal GPS...', {
        description: 'A localização está a ser obtida'
      });
      return;
    }

    // Visual feedback immediately
    toast.info(`${emoji} A registar...`);

    // Add marker to map immediately for instant visual feedback
    const newMarker = { 
      lat: currentPosition.lat, 
      lng: currentPosition.lng, 
      emoji, 
      timestamp: new Date().toISOString() 
    };
    
    setPathMarkers(prev => {
      console.log('📌 Adding marker:', newMarker);
      return [...prev, newMarker];
    });

    // Create checkpoint in database
    try {
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: 'behavior_note',
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        timestamp: new Date().toISOString(),
        notes: message,
      });

      // Auto-send message to chat
      if (conversation?.id) {
        await sendMessageMutation.mutateAsync({ content: message, type: 'system' });
      }

      toast.success(`📍 ${message}`, {
        description: 'Evento registado com sucesso!'
      });
    } catch (err) {
      console.error('Event error:', err);
      toast.error('Erro ao registar evento');
      // Remove marker on error
      setPathMarkers(prev => prev.filter(m => m.timestamp !== newMarker.timestamp));
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info('A carregar foto...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Add marker
      if (currentPosition) {
        setPathMarkers(prev => [...prev, { 
          lat: currentPosition.lat, 
          lng: currentPosition.lng, 
          emoji: '📷', 
          timestamp: new Date().toISOString() 
        }]);
      }

      // Create checkpoint
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: 'photo_update',
        photo_url: file_url,
        latitude: currentPosition?.lat,
        longitude: currentPosition?.lng,
        timestamp: new Date().toISOString(),
      });

      // Auto-send to chat
      if (conversation?.id) {
        await sendMessageMutation.mutateAsync({ content: '📷 Nova foto enviada!', type: 'system' });
      }

      toast.success('Foto enviada!');
    } catch (error) {
      toast.error('Erro ao carregar foto');
    }
  };

  // Handle manual location correction
  const handleLocationCorrection = async (coords) => {
    if (!isCorrectionMode || !coords) return;

    try {
      if (!coords.lat || !coords.lng) {
        console.error('Invalid coordinates:', coords);
        return;
      }
      // Update current position immediately
      const correctedPos = {
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 0,
        timestamp: new Date().toISOString()
      };

      setCurrentPosition(correctedPos);

      // Save to database
      await base44.entities.Booking.update(bookingId, {
        walker_lat: coords.lat,
        walker_lng: coords.lng,
        last_update: correctedPos.timestamp,
      });

      // Send system message to chat
      if (conversation?.id) {
        await sendMessageMutation.mutateAsync({ 
          content: '📍 Localização atualizada manualmente pelo passeador.', 
          type: 'system' 
        });
      }

      toast.success('📍 Localização ajustada manualmente!');
      setIsCorrectionMode(false);
    } catch (error) {
      console.error('Location correction error:', error);
      toast.error('Erro ao ajustar localização');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!booking || booking.status !== 'in_progress') {
    return (
      <div className="h-[100dvh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">Serviço não ativo</div>
      </div>
    );
  }

  const mapCenter = currentPosition 
    ? [currentPosition.lng, currentPosition.lat]
    : booking.pickup_lng && booking.pickup_lat
    ? [booking.pickup_lng, booking.pickup_lat]
    : [-8.6291, 41.1579];

  const otherParticipant = React.useMemo(() => {
    if (!conversation || !user?.email) return null;
    const otherEmail = conversation.participants?.find((p) => p !== user.email);
    return {
      email: otherEmail,
      name: conversation.participant_names?.[otherEmail] || otherEmail?.split("@")[0] || "Cliente",
    };
  }, [conversation?.id, user?.email]);

  const ChatContent = () => {
    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages.length]);

    return (
      <>
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">Nenhuma mensagem</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {messages.map((msg) => {
                const isMine = msg.sender_email === user?.email;
                return (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isMine={isMine}
                    showAvatar={true}
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t bg-white shrink-0">
          <ChatInput
            onSendMessage={(data) => sendMessageMutation.mutate(data)}
            disabled={sendMessageMutation.isPending}
          />
        </div>
      </>
    );
  };

  return (
    <div className="h-[100dvh] md:h-screen relative overflow-hidden bg-gray-900">
      {/* Layer 0: Background Map - Full Screen */}
      <div className="absolute inset-0 z-0">
        <SafeMapWrapper>
          <UniversalMap 
          center={mapCenter} 
          zoom={16} 
          showControls={true} 
          controlsPosition="top-right"
          show3DControls={false}
          onMapClick={handleLocationCorrection}
        >
          {/* GPS Trail */}
          {booking.route_coordinates && booking.route_coordinates.length > 1 && (
            <MapRoute
              coordinates={booking.route_coordinates.map(c => [c.lng, c.lat])}
              color="#000000"
              width={4}
              opacity={1}
            />
          )}

          {/* Pickup Location */}
          {booking.pickup_lat && booking.pickup_lng && (
            <MapMarker longitude={booking.pickup_lng} latitude={booking.pickup_lat}>
              <MarkerContent>
                <div className="w-10 h-10 bg-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Current Position - Blue Dot with Pulsing Ring */}
          {currentPosition && (
            <MapMarker longitude={currentPosition.lng} latitude={currentPosition.lat}>
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  {/* Pulsing outer ring */}
                  <div className="absolute w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-ping" />
                  {/* Accuracy ring */}
                  <div className="absolute w-12 h-12 bg-blue-400 rounded-full opacity-30" />
                  {/* Main blue dot */}
                  <div className="relative w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  {/* Accuracy label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap">
                    ±{Math.round(currentPosition.accuracy)}m
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Event Markers - Interactive with Popups */}
          {pathMarkers.map((marker, idx) => {
            const eventLabels = {
              '💩': 'Fez cocô',
              '💧': 'Fez xixi',
              '🐕': 'Socializou',
              '💦': 'Bebeu água',
              '📷': 'Foto tirada'
            };
            
            const eventColors = {
              '💩': 'border-orange-400 bg-orange-50',
              '💧': 'border-blue-400 bg-blue-50',
              '🐕': 'border-pink-400 bg-pink-50',
              '💦': 'border-cyan-400 bg-cyan-50',
              '📷': 'border-purple-400 bg-purple-50'
            };
            
            return (
              <MapMarker key={idx} longitude={marker.lng} latitude={marker.lat}>
                <MarkerContent>
                  <div className={`w-10 h-10 rounded-full border-3 shadow-xl flex items-center justify-center text-xl cursor-pointer hover:scale-125 transition-transform ${eventColors[marker.emoji] || 'bg-white border-gray-300'}`}>
                    {marker.emoji}
                  </div>
                </MarkerContent>
                <MarkerTooltip>
                  {eventLabels[marker.emoji] || 'Evento'}
                </MarkerTooltip>
                <MarkerPopup>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-lg">{marker.emoji}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{eventLabels[marker.emoji]}</p>
                        <p className="text-xs text-gray-500">
                          {marker.timestamp ? format(new Date(marker.timestamp), 'HH:mm:ss', { locale: pt }) : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      📍 Lat: {marker.lat.toFixed(5)}, Lng: {marker.lng.toFixed(5)}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            );
          })}
          </UniversalMap>
        </SafeMapWrapper>
      </div>

      {/* Layer 1: Top Bar (Glass) - Safe Area for Mobile */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe px-3 pb-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-2 md:p-3">
          <div className="flex items-center justify-between gap-2">
            {/* Stats - Compact for Mobile */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2 bg-gray-100 rounded-full px-2 md:px-3 py-1">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                <span className="font-bold text-xs md:text-base text-gray-900">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2 bg-gray-100 rounded-full px-2 md:px-3 py-1">
                <Navigation className="w-3 h-3 md:w-4 md:h-4 text-gray-700" />
                <span className="font-bold text-xs md:text-base text-gray-900">{distanceKm.toFixed(2)} km</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 md:gap-2">
              <Button
                size="sm"
                className={`rounded-full px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm shadow-lg ${
                  isCorrectionMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={() => {
                  setIsCorrectionMode(!isCorrectionMode);
                  if (!isCorrectionMode) {
                    toast.info('📍 Clique no mapa para corrigir a localização');
                  } else {
                    toast.info('Modo de correção desativado');
                  }
                }}
              >
                📍 <span className="hidden md:inline ml-1">{isCorrectionMode ? 'Confirmar' : 'Ajustar'}</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 rounded-full px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm shadow-lg"
                onClick={() => {
                  if (confirm('⚠️ ATIVAR SOS?')) {
                    toast.error('🚨 EMERGÊNCIA ATIVADA!');
                  }
                }}
              >
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline ml-1">SOS</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Correction Mode Overlay - Mobile Safe */}
      {isCorrectionMode && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 bg-green-600 text-white px-3 md:px-4 py-2 rounded-full shadow-2xl font-bold text-xs md:text-sm animate-pulse pointer-events-none" 
             style={{ top: 'calc(70px + env(safe-area-inset-top))' }}>
          👆 Clique no mapa para ajustar
        </div>
      )}

      {/* Layer 2: Bottom Action Bar - Safe Area for Mobile */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-safe" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-3 md:p-4">
          {/* Dog Info - Compact on Mobile */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl md:text-2xl">🐕</span>
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base text-gray-900">{booking.dog_name}</h3>
                <p className="text-xs md:text-sm text-gray-500">{booking.owner_name}</p>
              </div>
            </div>
            <div className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] md:text-xs font-bold animate-pulse">
              🔴 AO VIVO
            </div>
          </div>

          {/* GPS Status Indicator */}
          {!currentPosition && (
            <div className="mb-3 p-2 bg-blue-50 border-2 border-blue-300 rounded-xl text-center">
              <p className="text-xs font-bold text-blue-700 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                📡 A obter sinal GPS...
              </p>
            </div>
          )}

          {/* Circular Action Buttons - Responsive */}
          <div className="flex items-center justify-around gap-1 md:gap-2 mb-3">
            <button
              onClick={() => {
                console.log('💩 Button clicked!');
                handleQuickEvent('💩', 'O cão fez cocô! 💩');
              }}
              disabled={!currentPosition}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-xl flex items-center justify-center text-2xl md:text-3xl active:scale-95 transition-transform touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Cocô"
            >
              💩
            </button>

            <button
              onClick={() => {
                console.log('💧 Button clicked!');
                handleQuickEvent('💧', 'O cão fez xixi! 💧');
              }}
              disabled={!currentPosition}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-xl flex items-center justify-center text-2xl md:text-3xl active:scale-95 transition-transform touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Xixi"
            >
              💧
            </button>

            <button
              onClick={() => handleQuickEvent('💦', 'O cão bebeu água! 💦')}
              disabled={!currentPosition}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-xl flex items-center justify-center text-2xl md:text-3xl active:scale-95 transition-transform touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Água"
            >
              💦
            </button>

            <button
              onClick={() => handleQuickEvent('🐕', 'O cão socializou com outros cães! 🐕')}
              disabled={!currentPosition}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full shadow-xl flex items-center justify-center text-2xl md:text-3xl active:scale-95 transition-transform touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Social"
            >
              🐕
            </button>

            <button
              onClick={() => handleQuickEvent('😰', 'O cão está cansado ou precisa de pausa 😰')}
              disabled={!currentPosition}
              className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full shadow-xl flex items-center justify-center text-2xl md:text-3xl active:scale-95 transition-transform touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Cansado"
            >
              😰
            </button>

            <label className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform cursor-pointer touch-manipulation ${!currentPosition ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={!currentPosition}
              />
            </label>

            <button
              onClick={() => setIsChatOpen(true)}
              className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
              aria-label="Chat"
            >
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </div>
              )}
            </button>
          </div>

          {/* End Walk Button - QR Scanner */}
          <WalkScanner
            booking={booking}
            type="END"
            onScanSuccess={async () => {
              // Status already updated by scanner
              await base44.entities.Booking.update(bookingId, { 
                distance_km: distanceKm
              });
              queryClient.invalidateQueries(['activeBooking']);
              navigate(createPageUrl('ProfessionalDashboard'));
            }}
            onScanError={() => {
              toast.error('Verificação falhou - tente novamente');
            }}
          />
        </div>
      </div>

      {/* Chat Drawer (Mobile) - FIXED: Full viewport height */}
      <div className="md:hidden">
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerContent className="h-[100dvh] flex flex-col bg-white border-0 rounded-t-3xl">
            <DrawerHeader className="border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-3xl shrink-0">
              <DrawerTitle className="text-white flex items-center gap-2">
                💬 Chat com {otherParticipant?.name}
              </DrawerTitle>
            </DrawerHeader>
            <ChatContent />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Chat Sheet (Desktop) */}
      <div className="hidden md:block">
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetContent side="right" className="w-[500px] flex flex-col p-0 bg-white">
            <SheetHeader className="p-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <SheetTitle className="text-white">💬 Chat com {otherParticipant?.name}</SheetTitle>
            </SheetHeader>
            <ChatContent />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}