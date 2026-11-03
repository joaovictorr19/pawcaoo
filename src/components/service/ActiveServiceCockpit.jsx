import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CockpitLoadingState from "@/components/service/CockpitLoadingState";
import CockpitErrorState from "@/components/service/CockpitErrorState";
import CockpitPendingStartState from "@/components/service/CockpitPendingStartState";
import CockpitCompletedState from "@/components/service/CockpitCompletedState";
import CockpitTopBar from "@/components/service/CockpitTopBar";
import CockpitChatPanel from "@/components/service/CockpitChatPanel";
import { 
  MessageCircle, 
  AlertTriangle, 
  Camera, 
  Clock,
  Navigation,
  CheckCircle,
  Thermometer,
  Frown,
  Plus,
  X
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { WalkScanner } from "@/components/booking/WalkScanner";
import WalkerFinalizeQR from "@/components/service/WalkerFinalizeQR";

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
  const [, setPathMarkers] = useState([]);
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);

  // Fetch booking
  const { data: booking, error, isLoading: loadingBooking } = useQuery({
    queryKey: ['activeBooking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      
      if (!bookings || bookings.length === 0) {
        throw new Error('Reserva não encontrada');
      }
      
      return bookings[0];
    },
    enabled: !!bookingId,
    refetchInterval: 2000,
    retry: 2,
    retryDelay: 1000,
  });

  // SECURITY: Admin Bypass - Admins can view any service
  useEffect(() => {
    if (!booking || !user) return;

    const isOwner = booking.owner_email === user.email || booking.created_by === user.email;
    const isWalker = booking.walker_email === user.email;
    const isAdmin = user.role === 'admin';


    if (!isOwner && !isWalker && !isAdmin) {
      console.error('❌ [COCKPIT] Access denied');
      toast.error('Acesso negado: Não é participante desta reserva');
      navigate(createPageUrl('Home'));
    } else {
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

  const unreadCount = useMemo(() => {
    if (!messages || !user?.email) return 0;
    return messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email)).length;
  }, [messages, user?.email]);

  // GPS tracking disabled — rastreamento de passeio desativado.
  // A localização só é pedida quando o utilizador toca explicitamente num botão de GPS.
  useEffect(() => {
    setIsTracking(false);
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [booking?.status]);

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

  // Handle quick event (Poop, Pee, Water, Social) — sem GPS
  const handleQuickEvent = async (emoji, message) => {
    toast.info(`${emoji} A registar...`);

    const newMarker = {
      emoji,
      timestamp: new Date().toISOString()
    };

    setPathMarkers(prev => [...prev, newMarker]);

    try {
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: 'behavior_note',
        timestamp: new Date().toISOString(),
        notes: message,
      });

      if (conversation?.id) {
        await sendMessageMutation.mutateAsync({ content: message, type: 'system' });
      }

      toast.success(`${emoji} ${message}`, {
        description: 'Evento registado com sucesso!'
      });
    } catch (err) {
      console.error('Event error:', err);
      toast.error('Erro ao registar evento');
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
      
      setPathMarkers(prev => [...prev, {
        emoji: '📷',
        timestamp: new Date().toISOString()
      }]);

      // Create checkpoint (sem coordenadas GPS)
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: 'photo_update',
        photo_url: file_url,
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
          content: '📍 Localização atualizada manualmente pelo Dog Walker.', 
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

  const isOwner = !!(user && booking && (booking.owner_email === user.email || booking.created_by === user.email));

  const otherParticipant = useMemo(() => {
    if (!conversation || !user?.email) return null;
    const otherEmail = conversation.participants?.find((p) => p !== user.email);
    return {
      email: otherEmail,
      name: conversation.participant_names?.[otherEmail] || otherEmail?.split("@")[0] || "Cliente",
    };
  }, [conversation?.id, user?.email]);

  useEffect(() => {
    if (booking?.status === 'completed' && isOwner) {
      setShowReview(true);
    }
  }, [booking?.status, isOwner]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingBooking) {
    return <CockpitLoadingState />;
  }

  if (error || !booking) {
    return <CockpitErrorState error={error} />;
  }



  if (booking.status === 'completed') {
    return (
      <CockpitCompletedState
        booking={booking}
        isOwner={isOwner}
        showReview={showReview}
        setShowReview={setShowReview}
        onSubmitReview={async (reviewData) => {
          try {
            await base44.entities.Review.create(reviewData);
            if (reviewData.tip_amount > 0) {
              await base44.entities.Booking.update(booking.id, {
                tip_amount: reviewData.tip_amount,
                total_amount: (booking.total_amount || 0) + reviewData.tip_amount
              });
            }
            const profile = await base44.entities.WalkerProfile.get(booking.walker_id);
            if (profile) {
              const currentRating = profile.rating || 5;
              const currentCount = profile.total_walks || 1;
              const newRating = ((currentRating * currentCount) + reviewData.rating) / (currentCount + 1);
              await base44.entities.WalkerProfile.update(booking.walker_id, {
                rating: parseFloat(newRating.toFixed(2)),
                total_walks: currentCount + 1
              });
            }
            toast.success('✅ Avaliação enviada com sucesso!');
            setShowReview(false);
            navigate(createPageUrl('ClientDashboard'));
          } catch (error) {
            console.error('Review error:', error);
            toast.error('Erro ao enviar avaliação');
          }
        }}
      />
    );
  }

  const isOwnerParticipant = !!(user && booking && (booking.owner_email === user.email || booking.created_by === user.email));
  const isWalkerParticipant = !!(user && booking && booking.walker_email === user.email);

  if (!['confirmed', 'in_progress', 'service_completed', 'completed'].includes(booking.status)) {
    return (
      <div className="h-[100dvh] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">Serviço não está disponível</div>
      </div>
    );
  }

  if (booking.status === 'confirmed') {
    return (
      <CockpitPendingStartState
        booking={booking}
        isOwnerParticipant={isOwnerParticipant}
        isWalkerParticipant={isWalkerParticipant}
        onStartSuccess={() => {
          queryClient.invalidateQueries(['activeBooking']);
          toast.success('Passeio iniciado com sucesso.');
        }}
        onStartError={() => {
          toast.error('Falha na validação do QR de início.');
        }}
      />
    );
  }

  // Note: Map functionality removed - no rendering of map component

  return (
    <div className="h-[100dvh] md:h-screen relative overflow-hidden bg-gray-900">
      {/* Layer 0: Background - Gray placeholder */}
      <div className="absolute inset-0 z-0 bg-gray-800"></div>

      <CockpitTopBar elapsedTime={elapsedTime} distanceKm={distanceKm} formatTime={formatTime} />

      {/* Layer 2: Bottom Compact Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-2 md:px-3 pb-safe" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-2 md:p-3">
          {/* Dog Info - Ultra Compact */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-base md:text-xl">🐕</span>
              </div>
              <div>
                <h3 className="font-bold text-xs md:text-sm text-gray-900">{booking.dog_name}</h3>
                <p className="text-[10px] md:text-xs text-gray-500">{booking.owner_name}</p>
              </div>
            </div>
            <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] md:text-[10px] font-bold animate-pulse">
              🔴 VIVO
            </div>
          </div>

          {booking?.status === 'in_progress' && (
            <div className="mb-2 p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-center">
              <p className="text-[10px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                Passeio em curso
              </p>
            </div>
          )}

          {/* Compact Actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Event Dropdown */}
            <DropdownMenu open={isEventMenuOpen} onOpenChange={setIsEventMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Evento</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 mb-2 max-h-[50vh] overflow-y-auto">
                <DropdownMenuLabel className="text-[10px]">Registar Evento</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('💩', 'Fez cocô 💩'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">💩</span>
                  <span className="text-xs font-medium">Fez cocô</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('💧', 'Fez xixi 💧'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">💧</span>
                  <span className="text-xs font-medium">Fez xixi</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('💦', 'Bebeu água 💦'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">💦</span>
                  <span className="text-xs font-medium">Bebeu água</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('🐕', 'Socializou 🐕'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">🐕</span>
                  <span className="text-xs font-medium">Socializou</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('🍖', 'Petisco 🍖'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">🍖</span>
                  <span className="text-xs font-medium">Petisco</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('🏃', 'Correu 🏃'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">🏃</span>
                  <span className="text-xs font-medium">Correu/Brincou</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('😰', 'Cansado 😰'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">😰</span>
                  <span className="text-xs font-medium">Cansado</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('😠', 'Irritado 😠'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">😠</span>
                  <span className="text-xs font-medium">Irritado</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('🤢', 'Mal-estar 🤢'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">🤢</span>
                  <span className="text-xs font-medium">Mal-estar</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => { handleQuickEvent('😴', 'Descansou 😴'); setIsEventMenuOpen(false); }}>
                  <span className="text-xl mr-2">😴</span>
                  <span className="text-xs font-medium">Descansou</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Photo Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg active:scale-95 transition-all cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-bold hidden md:inline">Chat</span>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          </div>

          {/* End Walk Button */}
          <div className="mt-2">
            {isWalkerParticipant ? (
              <WalkerFinalizeQR
                booking={booking}
                onClientNotified={() => {
                  queryClient.invalidateQueries(['activeBooking']);
                }}
              />
            ) : (
              <WalkScanner
                booking={booking}
                type="END"
                scannerLabel="📱 Ler QR do Dog Walker"
                onScanSuccess={async () => {
                  await base44.entities.Booking.update(bookingId, {
                    distance_km: distanceKm
                  });
                  queryClient.invalidateQueries(['activeBooking']);
                  toast.success('✅ Pagamento transferido e passeio concluído!');
                  navigate(createPageUrl("ClientDashboard"));
                }}
                onScanError={() => {
                  toast.error('Verificação falhou');
                }}
              />
            )}
          </div>
        </div>
      </div>

      <CockpitChatPanel
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        otherParticipant={otherParticipant}
        messages={messages}
        user={user}
        scrollRef={scrollRef}
        sendMessageMutation={sendMessageMutation}
      />
    </div>
  );
}