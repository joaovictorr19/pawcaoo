import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import ActiveServiceCockpit from "@/components/service/ActiveServiceCockpit";

export default function ActiveWalkDashboard() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!bookingId || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">A carregar...</div>
      </div>
    );
  }

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
    enabled: !!conversation?.id && showChat,
    refetchInterval: showChat ? 2000 : false,
  });

  const unreadCount = React.useMemo(() => {
    if (!messages || !user?.email) return 0;
    return messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email)).length;
  }, [messages, user?.email]);

  // Real-time GPS tracking with debounce
  const updateIntervalRef = useRef(null);
  const pendingPositionRef = useRef(null);

  useEffect(() => {
    if (booking?.status === 'in_progress' && navigator.geolocation && !isTracking) {
      console.log('🚀 Starting real-time GPS tracking...');
      setIsTracking(true);
      startTimeRef.current = booking.walk_start_time ? new Date(booking.walk_start_time) : new Date();

      // Watch position continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          
          // Update UI immediately
          setCurrentPosition(newPos);
          pendingPositionRef.current = newPos;
          
          console.log('📍 GPS Update:', newPos.lat.toFixed(6), newPos.lng.toFixed(6), '±', newPos.accuracy.toFixed(0), 'm');
        },
        (error) => console.error('GPS error:', error),
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0,
          distanceFilter: 5 // iOS optimization
        }
      );

      // Batch update database every 3 seconds
      updateIntervalRef.current = setInterval(async () => {
        if (pendingPositionRef.current) {
          const pos = pendingPositionRef.current;
          pendingPositionRef.current = null;

          try {
            await base44.entities.Booking.update(bookingId, {
              walker_lat: pos.lat,
              walker_lng: pos.lng,
              last_update: pos.timestamp,
              route_coordinates: [...(booking.route_coordinates || []), pos]
            });
            console.log('✅ Position saved to DB');
          } catch (err) {
            console.error('❌ DB update error:', err);
          }
        }
      }, 3000);
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        console.log('🛑 GPS tracking stopped');
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
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

  // Handle route selection from saved routes
  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    // Pre-load route on map but don't override GPS tracking
    toast.success(`Rota "${route.route_name}" carregada como guia!`);
  };

  // Handle route updates during walk
  const handleUpdateRoute = (newCoordinates) => {
    base44.entities.Booking.update(bookingId, {
      route_coordinates: newCoordinates
    }).catch(err => console.error('Route update error:', err));
  };

  const handleAddWaypoint = (waypoint) => {
    const updated = [...(booking.route_coordinates || []), waypoint];
    handleUpdateRoute(updated);
  };

  const handleRemoveWaypoint = (index) => {
    const updated = booking.route_coordinates.filter((_, idx) => idx !== index);
    handleUpdateRoute(updated);
  };

  // Save current route
  const handleSaveCurrentRoute = () => {
    if (!booking.route_coordinates || booking.route_coordinates.length < 2) {
      toast.error('Caminhe mais para guardar esta rota');
      return;
    }

    const routeData = {
      coordinates: booking.route_coordinates,
      distance_km: distanceKm,
      duration_minutes: Math.floor(elapsedTime / 60)
    };

    setShowSaveRoute(true);
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

  // Route display logic - Show selected route as guide OR actual GPS trail
  const displayRoute = selectedRoute 
    ? selectedRoute.coordinates.map(c => [c.lng, c.lat])
    : booking.route_coordinates?.map(c => [c.lng, c.lat]) || [];

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
    <div className="fixed inset-0 bg-white">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <MapComponent center={mapCenter} zoom={15}>
          {/* Selected Guide Route - Dashed Blue */}
          {selectedRoute && selectedRoute.coordinates.length > 1 && (
            <MapRoute
              coordinates={selectedRoute.coordinates.map(c => [c.lng, c.lat])}
              color="#3b82f6"
              width={3}
              opacity={0.5}
            />
          )}

          {/* Actual GPS Trail - Solid Black */}
          {booking.route_coordinates && booking.route_coordinates.length > 1 && (
            <MapRoute
              coordinates={booking.route_coordinates.map(c => [c.lng, c.lat])}
              color="#000000"
              width={5}
              opacity={1}
            />
          )}

          {/* Pickup Location */}
          {booking.pickup_lat && booking.pickup_lng && (
            <MapMarker longitude={booking.pickup_lng} latitude={booking.pickup_lat}>
              <MarkerContent>
                <div className="w-12 h-12 bg-black rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Current Walker Position - Clean Pin */}
          {currentPosition && (
            <MapMarker longitude={currentPosition.lng} latitude={currentPosition.lat}>
              <MarkerContent>
                <div className="relative">
                  <div className="absolute -inset-3 bg-black rounded-full opacity-10 animate-ping" />
                  <div className="w-14 h-14 bg-black rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                    <Navigation className="w-7 h-7 text-white" style={{ transform: 'rotate(45deg)' }} />
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Event Markers - Minimal */}
          {checkpoints.map((cp) => {
            if (!cp.latitude || !cp.longitude) return null;
            const icon = cp.checkpoint_type === 'photo_update' ? '📷' :
                        cp.checkpoint_type === 'behavior_note' ? '💩' : '📍';
            return (
              <MapMarker key={cp.id} longitude={cp.longitude} latitude={cp.latitude}>
                <MarkerContent>
                  <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300 shadow-lg flex items-center justify-center text-sm">
                    {icon}
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}

          <MapControls position="top-right" showZoom showLocate />
        </MapComponent>
      </div>

      {/* Top Bar - Minimal Stats */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 md:p-4 safe-area-inset-top">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-2 md:p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
                <span className="font-semibold text-sm md:text-lg text-gray-900">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Navigation className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
                <span className="font-semibold text-sm md:text-lg text-gray-900">{distanceKm.toFixed(2)} km</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 rounded-full px-2 md:px-4 h-8 md:h-9 text-xs md:text-sm flex-shrink-0"
              onClick={() => {
                if (confirm('⚠️ ATIVAR MODO EMERGÊNCIA?\n\nIsto notificará o dono e a plataforma imediatamente.')) {
                  toast.error('🚨 EMERGÊNCIA ATIVADA!');
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
              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 mr-0 md:mr-1" />
              <span className="hidden md:inline">SOS</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Control Panel - Uber Style */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4 safe-area-inset-bottom">
        <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-100">
          {/* Dog Info */}
          <div className="p-3 md:p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">🐕</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm md:text-base text-gray-900 truncate">{booking.dog_name}</h3>
                  <p className="text-xs md:text-sm text-gray-500 truncate">{booking.owner_name}</p>
                </div>
              </div>
              <div className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap flex-shrink-0">
                🔴 ATIVO
              </div>
            </div>
          </div>

          {/* Quick Actions - Compact Grid with Route Tools */}
          <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-1.5 md:gap-2 mb-2 md:mb-3">
              <button
                onClick={() => handleQuickEvent('behavior_note', '💩', 'O cão fez cocô!')}
                className="aspect-square bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm flex flex-col items-center justify-center transition-all"
                disabled={createCheckpointMutation.isPending}
              >
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">💩</span>
                <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Cocô</span>
              </button>

              <button
                onClick={() => handleQuickEvent('behavior_note', '💧', 'O cão fez xixi!')}
                className="aspect-square bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm flex flex-col items-center justify-center transition-all"
                disabled={createCheckpointMutation.isPending}
              >
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">💧</span>
                <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Xixi</span>
              </button>

              <label className="aspect-square bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm flex flex-col items-center justify-center transition-all cursor-pointer">
                <Camera className="w-5 h-5 md:w-7 md:h-7 mb-0.5 md:mb-1 text-gray-700" />
                <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Foto</span>
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
                className="aspect-square bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm flex flex-col items-center justify-center transition-all"
              >
                <Zap className="w-5 h-5 md:w-7 md:h-7 mb-0.5 md:mb-1 text-gray-700" />
                <span className="text-[9px] md:text-[10px] font-medium text-gray-600">Status</span>
              </button>
            </div>

            {/* Route Management Row */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              <button
                onClick={() => setShowRouteSelector(true)}
                className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm p-1.5 md:p-2 flex flex-col items-center justify-center transition-all"
              >
                <Bookmark className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1 text-purple-700" />
                <span className="text-[8px] md:text-[9px] font-medium text-purple-700">Rotas</span>
              </button>

              <button
                onClick={() => setShowRouteEditor(true)}
                className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm p-1.5 md:p-2 flex flex-col items-center justify-center transition-all"
              >
                <Edit3 className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1 text-blue-700" />
                <span className="text-[8px] md:text-[9px] font-medium text-blue-700">Editar</span>
              </button>

              <button
                onClick={handleSaveCurrentRoute}
                className="bg-green-50 hover:bg-green-100 border-2 border-green-200 active:scale-95 rounded-lg md:rounded-xl shadow-sm p-1.5 md:p-2 flex flex-col items-center justify-center transition-all"
              >
                <Bookmark className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1 text-green-700" />
                <span className="text-[8px] md:text-[9px] font-medium text-green-700">Guardar</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 md:p-4 flex gap-2 md:gap-3">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-11 md:h-12 border-2 border-gray-200 hover:bg-gray-50 relative rounded-xl text-sm md:text-base"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              <span className="font-semibold">Chat</span>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </Button>

            <Button
              size="lg"
              className="flex-1 h-11 md:h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm md:text-base shadow-lg"
              onClick={async () => {
                if (confirm('Finalizar o serviço e notificar o cliente?')) {
                  try {
                    await base44.entities.Booking.update(bookingId, { 
                      status: 'service_completed',
                      distance_km: distanceKm,
                      completed_date: new Date().toISOString()
                    });
                    
                    // Send notification to client
                    await base44.entities.Notification.create({
                      recipient_email: booking.created_by,
                      title: '✅ Serviço Concluído',
                      message: `O passeio do ${booking.dog_name} foi concluído! Distância: ${distanceKm.toFixed(2)}km`,
                      type: 'service_completed',
                      related_id: bookingId,
                      priority: 'high'
                    });
                    
                    toast.success('Serviço concluído!');
                    navigate(createPageUrl('ProfessionalDashboard'));
                  } catch (error) {
                    toast.error('Erro ao finalizar');
                  }
                }
              }}
            >
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Sheet */}
      {showChat && (
        <Sheet open={showChat} onOpenChange={setShowChat}>
          <SheetContent side="bottom" className="h-[70vh] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Chat com {booking.owner_name}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 h-[calc(70vh-80px)]">
              {messages && messages.length > 0 ? (
                messages.map((msg) => {
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
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nenhuma mensagem ainda
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

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

      {/* Route Selector Modal */}
      <RouteSelectorModal
        isOpen={showRouteSelector}
        onClose={() => setShowRouteSelector(false)}
        onSelectRoute={handleSelectRoute}
        currentUserEmail={user?.email}
      />

      {/* Save Route Modal */}
      <SaveRouteModal
        isOpen={showSaveRoute}
        onClose={() => setShowSaveRoute(false)}
        routeData={{
          coordinates: booking.route_coordinates || [],
          distance_km: distanceKm,
          duration_minutes: Math.floor(elapsedTime / 60)
        }}
        userEmail={user?.email}
      />

      {/* Route Editor Panel */}
      <RouteEditorPanel
        isOpen={showRouteEditor}
        onClose={() => setShowRouteEditor(false)}
        routeCoordinates={booking.route_coordinates || []}
        onUpdateRoute={handleUpdateRoute}
        onAddWaypoint={handleAddWaypoint}
        onRemoveWaypoint={handleRemoveWaypoint}
        currentPosition={currentPosition}
      />
    </div>
  );
}