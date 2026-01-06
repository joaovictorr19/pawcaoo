import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { 
  MessageCircle, 
  AlertTriangle, 
  Camera, 
  CheckCircle,
  Clock,
  Navigation,
  Zap,
  Bookmark,
  Edit3,
} from "lucide-react";
import { Map, MapRoute, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import RouteSelectorModal from "@/components/walk/RouteSelectorModal";
import SaveRouteModal from "@/components/walk/SaveRouteModal";
import RouteEditorPanel from "@/components/walk/RouteEditorPanel";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function ActiveServiceCockpit({ bookingId, user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showSaveRoute, setShowSaveRoute] = useState(false);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const pendingPositionRef = useRef(null);

  // Fetch booking
  const { data: booking } = useQuery({
    queryKey: ['activeBooking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: !!bookingId,
    refetchInterval: 2000,
  });

  // Fetch checkpoints
  const { data: checkpoints = [] } = useQuery({
    queryKey: ['walkCheckpoints', bookingId],
    queryFn: async () => {
      const cps = await base44.entities.WalkCheckpoint.filter({ booking_id: bookingId }, 'created_date');
      return cps;
    },
    enabled: !!bookingId,
    refetchInterval: 3000,
  });

  // Fetch conversation
  const { data: conversation } = useQuery({
    queryKey: ['bookingConversation', bookingId],
    queryFn: async () => {
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
    enabled: !!conversation?.id && isChatOpen,
    refetchInterval: isChatOpen ? 2000 : false,
  });

  const unreadCount = React.useMemo(() => {
    if (!messages || !user?.email) return 0;
    return messages.filter(m => m.sender_email !== user?.email && !m.read_by?.includes(user?.email)).length;
  }, [messages, user?.email]);

  // GPS tracking
  useEffect(() => {
    if (booking?.status === 'in_progress' && navigator.geolocation && !isTracking) {
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
          pendingPositionRef.current = newPos;
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

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
          } catch (err) {
            console.error('DB update error:', err);
          }
        }
      }, 3000);
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
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

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!booking || booking.status !== 'in_progress') {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">Serviço não ativo</div>
      </div>
    );
  }

  const displayRoute = selectedRoute 
    ? selectedRoute.coordinates.map(c => [c.lng, c.lat])
    : booking.route_coordinates?.map(c => [c.lng, c.lat]) || [];

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

  const ChatContent = () => (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="space-y-1">
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
      <div className="border-t bg-white">
        <ChatInput
          onSendMessage={(data) => sendMessageMutation.mutate(data)}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-white">
      {/* Fullscreen Map - z-index 0 */}
      <div className="absolute inset-0">
        <Map center={mapCenter} zoom={15}>
          {selectedRoute && selectedRoute.coordinates.length > 1 && (
            <MapRoute
              coordinates={selectedRoute.coordinates.map(c => [c.lng, c.lat])}
              color="#3b82f6"
              width={3}
              opacity={0.5}
            />
          )}

          {booking.route_coordinates && booking.route_coordinates.length > 1 && (
            <MapRoute
              coordinates={booking.route_coordinates.map(c => [c.lng, c.lat])}
              color="#000000"
              width={5}
              opacity={1}
            />
          )}

          {booking.pickup_lat && booking.pickup_lng && (
            <MapMarker longitude={booking.pickup_lng} latitude={booking.pickup_lat}>
              <MarkerContent>
                <div className="w-12 h-12 bg-black rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

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

          <MapControls position="top-right" showZoom showLocate />
        </Map>
      </div>

      {/* Top Bar - z-index 20 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 safe-area-inset-top">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-lg">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-lg">{distanceKm.toFixed(2)} km</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 rounded-full px-4"
              onClick={() => {
                if (confirm('⚠️ ATIVAR MODO EMERGÊNCIA?')) {
                  toast.error('🚨 EMERGÊNCIA ATIVADA!');
                }
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              SOS
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Control Panel - z-index 20 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 safe-area-inset-bottom">
        <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-100">
          {/* Dog Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🐕</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{booking.dog_name}</h3>
                  <p className="text-sm text-gray-500">{booking.owner_name}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                🔴 ATIVO
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 flex gap-3">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 h-12 border-2 relative rounded-xl"
              onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </Button>

            <Button
              size="lg"
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg"
              onClick={async () => {
                if (confirm('Finalizar o serviço?')) {
                  await base44.entities.Booking.update(bookingId, { 
                    status: 'service_completed',
                    distance_km: distanceKm,
                    completed_date: new Date().toISOString()
                  });
                  toast.success('Serviço concluído!');
                  navigate(createPageUrl('ProfessionalDashboard'));
                }
              }}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Drawer (Mobile) - z-index 50 */}
      <div className="md:hidden">
        <Drawer open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DrawerContent className="h-[85vh] flex flex-col">
            <DrawerHeader className="border-b">
              <DrawerTitle>Chat com {otherParticipant?.name}</DrawerTitle>
            </DrawerHeader>
            <ChatContent />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Chat Sheet (Desktop) - z-index 50 */}
      <div className="hidden md:block">
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetContent side="right" className="w-[400px] flex flex-col p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Chat com {otherParticipant?.name}</SheetTitle>
            </SheetHeader>
            <ChatContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      <RouteSelectorModal
        isOpen={showRouteSelector}
        onClose={() => setShowRouteSelector(false)}
        onSelectRoute={setSelectedRoute}
        currentUserEmail={user?.email}
      />

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

      <RouteEditorPanel
        isOpen={showRouteEditor}
        onClose={() => setShowRouteEditor(false)}
        routeCoordinates={booking.route_coordinates || []}
        currentPosition={currentPosition}
      />
    </div>
  );
}