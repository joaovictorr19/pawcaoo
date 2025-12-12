import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Send,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Navigation,
  Clock,
  ChevronLeft,
  Camera,
  Upload,
  AlertCircle,
  Euro
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const [message, setMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [showBehaviorForm, setShowBehaviorForm] = useState(false);
  const [behaviorData, setBehaviorData] = useState({
    mood: "happy",
    energy_level: "normal",
    bathroom_breaks: 0,
    water_intake: false,
    played_with_other_dogs: false,
    special_notes: ""
  });
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef(null);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch booking
  const { data: booking, isLoading: loadingBooking } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      return bookings[0] || null;
    },
    enabled: !!bookingId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch or create conversation
  const { data: conversation, isLoading: loadingConvo } = useQuery({
    queryKey: ["conversation", bookingId],
    queryFn: async () => {
      if (!bookingId || !booking) return null;

      // Check if conversation exists
      const existing = await base44.entities.ChatConversation.filter({
        booking_id: bookingId,
      });

      if (existing && existing.length > 0) {
        return existing[0];
      }

      // Create new conversation
      const participants = [
        booking.created_by || booking.owner_email,
        booking.walker_email || booking.trainer_email,
      ].filter(Boolean);

      const newConvo = await base44.entities.ChatConversation.create({
        participants,
        booking_id: bookingId,
        tags: ["booking", booking.type || "walk"],
        last_message: "Chat iniciado",
        last_message_date: new Date().toISOString(),
        unread_counts: {},
      });

      return newConvo;
    },
    enabled: !!bookingId && !!booking,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: conversation.id },
        "created_date"
      );
      return msgs;
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Real-time polling
  });

  // Fetch checkpoints for GPS tracking
  const { data: checkpoints = [] } = useQuery({
    queryKey: ["checkpoints", bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      return await base44.entities.WalkCheckpoint.filter(
        { booking_id: bookingId },
        "created_date"
      );
    },
    enabled: !!bookingId,
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        message: messageData.text,
        message_type: messageData.type || "text",
        photo_url: messageData.photo_url,
        location: messageData.location,
        is_read: false,
      });

      // Update conversation
      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: messageData.text || "📎 Anexo",
        last_message_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", conversation?.id]);
      queryClient.invalidateQueries(["conversation", bookingId]);
      setMessage("");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      setUploadingPhoto(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create checkpoint with photo
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: user.email,
        checkpoint_type: "photo_update",
        photo_url: file_url,
        timestamp: new Date().toISOString(),
      });

      // Send in chat
      await sendMessageMutation.mutateAsync({
        text: "📷 Foto enviada",
        type: "photo",
        photo_url: file_url,
      });

      return file_url;
    },
    onSuccess: () => {
      setUploadingPhoto(false);
      queryClient.invalidateQueries(["checkpoints", bookingId]);
      toast.success("Foto enviada!");
    },
    onError: () => {
      setUploadingPhoto(false);
      toast.error("Erro ao enviar foto");
    },
  });

  // Share location mutation
  const shareLocationMutation = useMutation({
    mutationFn: async () => {
      setSharingLocation(true);
      
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            // Calculate distance from previous checkpoint
            let distanceKm = 0;
            if (checkpoints.length > 0) {
              const lastCheckpoint = checkpoints[checkpoints.length - 1];
              if (lastCheckpoint.latitude && lastCheckpoint.longitude) {
                const distanceM = calculateDistance(
                  lastCheckpoint.latitude,
                  lastCheckpoint.longitude,
                  latitude,
                  longitude
                );
                distanceKm = distanceM / 1000;
              }
            }

            // Create checkpoint
            await base44.entities.WalkCheckpoint.create({
              booking_id: bookingId,
              walker_email: user.email,
              checkpoint_type: "midpoint",
              latitude,
              longitude,
              distance_km: distanceKm,
              timestamp: new Date().toISOString(),
            });

            // Update booking coordinates and total distance
            const totalDistance = checkpoints.reduce((sum, c) => sum + (c.distance_km || 0), 0) + distanceKm;
            
            await base44.entities.Booking.update(bookingId, {
              walker_lat: latitude,
              walker_lng: longitude,
              distance_km: totalDistance,
              last_update: new Date().toISOString(),
            });

            // Send in chat
            await sendMessageMutation.mutateAsync({
              text: `📍 Localização partilhada • ${totalDistance.toFixed(2)}km percorridos`,
              type: "location",
              location: { latitude, longitude, accuracy },
            });

            resolve({ latitude, longitude });
          },
          (error) => {
            reject(error);
          }
        );
      });
    },
    onSuccess: () => {
      setSharingLocation(false);
      queryClient.invalidateQueries(["booking", bookingId]);
      queryClient.invalidateQueries(["checkpoints", bookingId]);
      toast.success("Localização partilhada!");
    },
    onError: () => {
      setSharingLocation(false);
      toast.error("Erro ao partilhar localização");
    },
  });

  // Submit behavior update
  const submitBehaviorMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            await base44.entities.WalkCheckpoint.create({
              booking_id: bookingId,
              walker_email: user.email,
              checkpoint_type: "behavior_note",
              latitude,
              longitude,
              dog_behavior: behaviorData,
              notes: behaviorData.special_notes || "Atualização de comportamento",
              timestamp: new Date().toISOString(),
            });

            // Send in chat
            await sendMessageMutation.mutateAsync({
              text: `🐕 Atualização: ${booking.dog_name} está ${behaviorData.mood} com energia ${behaviorData.energy_level}`,
              type: "text",
            });

            resolve();
          },
          (error) => reject(error)
        );
      });
    },
    onSuccess: () => {
      toast.success("Comportamento registrado!");
      setShowBehaviorForm(false);
      setBehaviorData({
        mood: "happy",
        energy_level: "normal",
        bathroom_breaks: 0,
        water_intake: false,
        played_with_other_dogs: false,
        special_notes: ""
      });
      queryClient.invalidateQueries(["checkpoints", bookingId]);
    },
    onError: () => {
      toast.error("Erro ao registrar comportamento");
    },
  });

  // Start service (check-in)
  const startServiceMutation = useMutation({
    mutationFn: async () => {
      // Request location permission explicitly
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          toast.error("Geolocalização não suportada neste dispositivo");
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Create check-in checkpoint
            await base44.entities.WalkCheckpoint.create({
              booking_id: bookingId,
              walker_email: user.email,
              checkpoint_type: "check_in",
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });

            // Update booking status and location
            await base44.entities.Booking.update(bookingId, {
              status: "in_progress",
              walker_lat: latitude,
              walker_lng: longitude,
              pickup_lat: latitude,
              pickup_lng: longitude,
              walk_start_time: new Date().toISOString(),
              last_update: new Date().toISOString(),
            });

            // Notify owner
            await base44.entities.Notification.create({
              recipient_email: booking.created_by || booking.owner_email,
              title: "🚶 Passeio Iniciado!",
              message: `${booking.walker_name} iniciou o passeio com ${booking.dog_name}. Acompanhe em tempo real!`,
              type: "check_in",
              related_id: bookingId,
              priority: "high",
            });

            toast.success("🎯 Rastreamento GPS ativado! A localização será atualizada automaticamente.");
            resolve();
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              toast.error("⚠️ Permissão de localização negada. Por favor, autorize o acesso nas configurações do navegador para continuar.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              toast.error("Localização não disponível. Verifique se o GPS está ativado.");
            } else if (error.code === error.TIMEOUT) {
              toast.error("Tempo de espera esgotado. Tente novamente.");
            }
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["booking", bookingId]);
      queryClient.invalidateQueries(["checkpoints", bookingId]);
    },
    onError: (error) => {
      console.error("Start service error:", error);
    },
  });

  // Finish walk with verification
  const finishWalkMutation = useMutation({
    mutationFn: async () => {
      // Get current location
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Verify proximity (50m from pickup location)
            if (booking.pickup_lat && booking.pickup_lng) {
              const distance = calculateDistance(
                latitude,
                longitude,
                booking.pickup_lat,
                booking.pickup_lng
              );

              if (distance > 50) {
                toast.error(`Está a ${Math.round(distance)}m do local. Aproxime-se a menos de 50m para concluir.`);
                reject(new Error("Muito longe do destino"));
                return;
              }
            }

            // Create final checkpoint
            await base44.entities.WalkCheckpoint.create({
              booking_id: bookingId,
              walker_email: user.email,
              checkpoint_type: "check_out",
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            });

            // Update booking status
            await base44.entities.Booking.update(bookingId, {
              status: "service_completed",
              completed_date: new Date().toISOString(),
              actual_delivery_distance: distance || 0,
            });

            // Release payment
            if (booking.payment_id) {
              await base44.entities.Payment.update(booking.payment_id, {
                status: "released",
                released_date: new Date().toISOString(),
              });
            }

            // Notify owner
            await base44.entities.Notification.create({
              recipient_email: booking.created_by || booking.owner_email,
              title: "✅ Serviço Concluído!",
              message: `${booking.walker_name} concluiu o passeio com ${booking.dog_name}. Pagamento liberado automaticamente.`,
              type: "check_out",
              related_id: bookingId,
              priority: "high",
            });

            resolve();
          },
          (error) => reject(error)
        );
      });
    },
    onSuccess: () => {
      toast.success("✅ Serviço concluído e pagamento liberado!");
      queryClient.invalidateQueries(["booking", bookingId]);
      navigate(-1);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao concluir serviço");
    },
  });

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ text: message, type: "text" });
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Continuous GPS tracking when service is in progress
  useEffect(() => {
    if (!isProfessional || booking?.status !== "in_progress" || !bookingId) {
      // Stop tracking if conditions not met
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setTrackingActive(false);
      }
      return;
    }

    // Start continuous tracking
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          startContinuousTracking();
        }
      });
    } else {
      startContinuousTracking();
    }

    function startContinuousTracking() {
      setTrackingActive(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Only update if accuracy is reasonable (< 50m)
          if (accuracy > 50) return;

          try {
            // Calculate distance from last checkpoint
            let distanceKm = 0;
            if (checkpoints.length > 0) {
              const lastCheckpoint = checkpoints[checkpoints.length - 1];
              if (lastCheckpoint.latitude && lastCheckpoint.longitude) {
                const distanceM = calculateDistance(
                  lastCheckpoint.latitude,
                  lastCheckpoint.longitude,
                  latitude,
                  longitude
                );
                distanceKm = distanceM / 1000;

                // Only create checkpoint if moved more than 50m
                if (distanceM < 50) {
                  // Just update booking coordinates without checkpoint
                  await base44.entities.Booking.update(bookingId, {
                    walker_lat: latitude,
                    walker_lng: longitude,
                    last_update: new Date().toISOString(),
                  });
                  return;
                }
              }
            }

            // Create automatic checkpoint
            await base44.entities.WalkCheckpoint.create({
              booking_id: bookingId,
              walker_email: user.email,
              checkpoint_type: "midpoint",
              latitude,
              longitude,
              distance_km: distanceKm,
              timestamp: new Date().toISOString(),
            });

            // Update booking
            const totalDistance = checkpoints.reduce((sum, c) => sum + (c.distance_km || 0), 0) + distanceKm;
            await base44.entities.Booking.update(bookingId, {
              walker_lat: latitude,
              walker_lng: longitude,
              distance_km: totalDistance,
              last_update: new Date().toISOString(),
            });

            // Invalidate queries to update UI
            queryClient.invalidateQueries(["booking", bookingId]);
            queryClient.invalidateQueries(["checkpoints", bookingId]);
          } catch (error) {
            console.error("Error updating GPS position:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Permissão de localização negada. Ative nas configurações do navegador.");
          }
          setTrackingActive(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setTrackingActive(false);
      }
    };
  }, [isProfessional, booking?.status, bookingId, checkpoints, user?.email, queryClient]);

  // Determine user role
  const isProfessional = user?.email === booking?.walker_email || user?.email === booking?.trainer_email;
  const isOwner = user?.email === booking?.created_by || user?.email === booking?.owner_email;

  if (loadingBooking || loadingConvo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!booking || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat não encontrado</h2>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  // Get GPS route coordinates
  const routeCoords = checkpoints
    .filter((c) => c.latitude && c.longitude)
    .map((c) => [c.latitude, c.longitude]);

  const lastKnownPosition =
    routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Avatar className="h-10 w-10">
          <AvatarImage
            src={isProfessional ? booking.owner?.photo_url : booking.walker?.photo_url}
          />
          <AvatarFallback>
            {(isProfessional ? booking.owner_name : booking.walker_name)?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {isProfessional ? booking.owner_name : booking.walker_name}
          </h3>
          <p className="text-xs text-gray-500">
            {booking.dog_name} • {format(new Date(booking.walk_date || booking.session_date), "dd MMM", { locale: pt })}
          </p>
        </div>

        <Badge
          className={
            booking.status === "in_progress"
              ? "bg-blue-100 text-blue-800"
              : booking.status === "confirmed"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {booking.status === "in_progress" ? "Em Andamento" : 
           booking.status === "confirmed" ? "Confirmado" : "Pendente"}
        </Badge>

        {booking.total_amount && (
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
            <Euro className="w-4 h-4" />
            {booking.total_amount}€
          </div>
        )}
      </div>

      {/* Payment Status Bar */}
      {booking.payment_id && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Pagamento:</span>
            <Badge className={
              booking.payment_status === "released" 
                ? "bg-green-100 text-green-800"
                : booking.payment_status === "held"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }>
              {booking.payment_status === "released" ? "✅ Liberado" :
               booking.payment_status === "held" ? "🔒 Retido (Seguro)" : "⏳ Pendente"}
            </Badge>
          </div>
        </div>
      )}

      {/* GPS Map (if service is in progress) */}
      {booking.status === "in_progress" && routeCoords.length > 0 && (
        <div className="h-48 relative">
          <MapContainer
            center={lastKnownPosition || [38.7223, -9.1393]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route polyline */}
            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} color="#3b82f6" weight={4} />
            )}

            {/* Current position marker */}
            {lastKnownPosition && (
              <Marker position={lastKnownPosition}>
                <Popup>Posição Atual</Popup>
              </Marker>
            )}

            {/* Destination (50m verification radius) */}
            {booking.pickup_lat && booking.pickup_lng && (
              <>
                <Marker position={[booking.pickup_lat, booking.pickup_lng]}>
                  <Popup>Destino</Popup>
                </Marker>
                <Circle
                  center={[booking.pickup_lat, booking.pickup_lng]}
                  radius={50}
                  pathOptions={{ color: "#22c55e", fillOpacity: 0.1 }}
                />
              </>
            )}
          </MapContainer>

          {/* Stats overlay */}
          <div className="absolute top-2 left-2 right-2 flex gap-2 z-[1000]">
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 flex-1">
              <p className="text-[10px] text-gray-500">Percorrido</p>
              <p className="text-sm font-bold text-blue-600">
                {(booking.distance_km || 0).toFixed(2)}km
              </p>
            </div>
            {lastKnownPosition && booking.pickup_lat && booking.pickup_lng && (
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 flex-1">
                <p className="text-[10px] text-gray-500">Até destino</p>
                <p className="text-sm font-bold text-green-600">
                  {Math.round(
                    calculateDistance(
                      lastKnownPosition[0],
                      lastKnownPosition[1],
                      booking.pickup_lat,
                      booking.pickup_lng
                    )
                  )}m
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Service Start Notification */}
          {checkpoints.find(c => c.checkpoint_type === 'check_in') && (
            <div className="flex justify-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-center">
                <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Serviço iniciado às {format(new Date(checkpoints.find(c => c.checkpoint_type === 'check_in').created_date), "HH:mm")}
                </span>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_email === user?.email;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  {msg.photo_url && (
                    <img
                      src={msg.photo_url}
                      alt="Attached"
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                  {msg.location && (
                    <div className="mb-2 p-2 bg-white/20 rounded-lg">
                      <p className="text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Localização partilhada
                      </p>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      isMine ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {format(new Date(msg.created_date), "HH:mm")}
                    {isMine && msg.is_read && <CheckCircle2 className="w-3 h-3" />}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Checkpoints Timeline */}
          {checkpoints.filter(c => c.checkpoint_type !== 'check_in' && c.notes).map((checkpoint) => (
            <div key={checkpoint.id} className="flex justify-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="font-medium text-gray-700">
                    {format(new Date(checkpoint.created_date), "HH:mm")}
                  </span>
                </div>
                <p className="text-gray-600">{checkpoint.notes}</p>
                {checkpoint.dog_behavior && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-[10px]">
                      Humor: {checkpoint.dog_behavior.mood} • 
                      Energia: {checkpoint.dog_behavior.energy_level}
                      {checkpoint.dog_behavior.water_intake && " • 💧 Bebeu água"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Service End Notification */}
          {checkpoints.find(c => c.checkpoint_type === 'check_out') && (
            <div className="flex justify-center">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-xs text-center">
                <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-green-600" />
                <span className="text-green-800 font-medium">
                  Serviço concluído às {format(new Date(checkpoints.find(c => c.checkpoint_type === 'check_out').created_date), "HH:mm")}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Professional Actions Bar - Start Service */}
      {isProfessional && booking.status === "confirmed" && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => startServiceMutation.mutate()}
            disabled={startServiceMutation.isPending}
          >
            <Navigation className="w-5 h-5 mr-2" />
            {startServiceMutation.isPending ? "Iniciando..." : "Iniciar Serviço"}
          </Button>
          <div className="mt-2 bg-white rounded-lg p-2 border border-green-200">
            <p className="text-xs text-green-800 font-medium mb-1">
              ℹ️ Ao iniciar, será pedida permissão de localização:
            </p>
            <ul className="text-[10px] text-green-700 space-y-0.5">
              <li>• Rastreamento GPS automático durante o serviço</li>
              <li>• Atualizações contínuas de localização</li>
              <li>• Necessário manter app aberto em segundo plano</li>
            </ul>
          </div>
        </div>
      )}

      {/* Professional Actions Bar - In Progress */}
      {isProfessional && booking.status === "in_progress" && !showBehaviorForm && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3 space-y-2">
          {/* GPS Status Indicator */}
          {trackingActive && (
            <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-lg p-2 mb-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-blue-800">
                GPS Ativo - Rastreamento Automático
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareLocationMutation.mutate()}
              disabled={sharingLocation}
              className="flex-1"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {sharingLocation ? "..." : "Localização"}
            </Button>

            <label htmlFor="photo-upload" className="flex-1">
              <Button
                size="sm"
                variant="outline"
                disabled={uploadingPhoto}
                className="w-full"
                asChild
              >
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  {uploadingPhoto ? "..." : "Foto"}
                </span>
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBehaviorForm(true)}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              Comportamento
            </Button>
          </div>

          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => finishWalkMutation.mutate()}
            disabled={finishWalkMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {finishWalkMutation.isPending ? "Finalizando..." : "Concluir Serviço"}
          </Button>
          
          <p className="text-xs text-center text-yellow-800">
            ⚠️ Aproxime-se a menos de 50m do destino para concluir
          </p>
        </div>
      )}

      {/* Behavior Form */}
      {isProfessional && showBehaviorForm && (
        <div className="bg-white border-t px-4 py-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Como está {booking.dog_name}?</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowBehaviorForm(false)}
            >
              ✕
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Humor</label>
              <select
                value={behaviorData.mood}
                onChange={(e) => setBehaviorData({...behaviorData, mood: e.target.value})}
                className="w-full text-sm border rounded-lg px-3 py-2"
              >
                <option value="happy">😊 Feliz</option>
                <option value="calm">😌 Calmo</option>
                <option value="excited">🤩 Animado</option>
                <option value="anxious">😰 Ansioso</option>
                <option value="tired">😴 Cansado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Energia</label>
              <select
                value={behaviorData.energy_level}
                onChange={(e) => setBehaviorData({...behaviorData, energy_level: e.target.value})}
                className="w-full text-sm border rounded-lg px-3 py-2"
              >
                <option value="low">🔵 Baixa</option>
                <option value="normal">🟢 Normal</option>
                <option value="high">🟡 Alta</option>
                <option value="very_high">🟠 Muito Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Pausas para necessidades</label>
            <input
              type="number"
              min="0"
              value={behaviorData.bathroom_breaks}
              onChange={(e) => setBehaviorData({...behaviorData, bathroom_breaks: parseInt(e.target.value)})}
              className="w-full text-sm border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={behaviorData.water_intake}
                onChange={(e) => setBehaviorData({...behaviorData, water_intake: e.target.checked})}
                className="rounded"
              />
              💧 Bebeu água
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={behaviorData.played_with_other_dogs}
                onChange={(e) => setBehaviorData({...behaviorData, played_with_other_dogs: e.target.checked})}
                className="rounded"
              />
              🐕 Brincou c/ outros
            </label>
          </div>

          <textarea
            placeholder="Notas adicionais (opcional)..."
            value={behaviorData.special_notes}
            onChange={(e) => setBehaviorData({...behaviorData, special_notes: e.target.value})}
            className="w-full text-sm border rounded-lg px-3 py-2 h-20 resize-none"
          />

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => submitBehaviorMutation.mutate()}
            disabled={submitBehaviorMutation.isPending}
          >
            {submitBehaviorMutation.isPending ? "Enviando..." : "Registrar Comportamento"}
          </Button>
        </div>
      )}

      {/* Owner View - Payment Info */}
      {isOwner && booking.status === "service_completed" && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-3">
          <div className="text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">
              Serviço Concluído!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Pagamento de {booking.total_amount}€ liberado automaticamente para {booking.walker_name}
            </p>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Escrever mensagem..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}