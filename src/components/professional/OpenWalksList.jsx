import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import WalkRequestCard from "./WalkRequestCard";
import { Loader2, MapPinOff } from "lucide-react";
import { toast } from "sonner";

export default function OpenWalksList({ walkerProfile }) {
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState(null);

  // Get user location for distance calculation
  useEffect(() => {
    if (walkerProfile?.latitude && walkerProfile?.longitude) {
      setUserLocation({ lat: walkerProfile.latitude, lng: walkerProfile.longitude });
    }
    // Try browser geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // Error or permission denied, fallback to profile location
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [walkerProfile]);

  // Fetch pending bookings
  const { data: openBookings = [], isLoading } = useQuery({
    queryKey: ["openWalkBookings"],
    queryFn: async () => {
      // Fetch pending bookings. Ideally, backend filters for walker_id=null.
      // Since we can't easily query "is null" in simple REST sometimes, we filter client-side.
      // We fetch the latest 50 pending bookings.
      const bookings = await base44.entities.Booking.filter({ status: "pending" }, "-created_date", 50);
      return bookings.filter((b) => !b.walker_id && !b.trainer_id);
    },
    refetchInterval: 15000, // Poll every 15s for new requests
  });

  // Accept booking mutation
  const acceptMutation = useMutation({
    mutationFn: async (booking) => {
      if (!walkerProfile?.id) throw new Error("Perfil de passeador não encontrado");
      
      // Update booking with walker info and status
      await base44.entities.Booking.update(booking.id, {
        walker_id: walkerProfile.id,
        walker_name: walkerProfile.walker_name,
        walker_email: walkerProfile.created_by, // Assuming created_by is the email
        status: "confirmed", // Auto-confirm for now, or "accepted" if there's a flow
        pickup_method: booking.pickup_method || "walker_pickup" // Ensure default
      });
      
      // Notify owner (simplified)
      try {
        await base44.functions.invoke("sendNotification", {
          recipient_email: booking.owner_email,
          title: "Passeio Aceite!",
          message: `${walkerProfile.walker_name} aceitou o teu pedido de passeio.`,
          type: "booking_confirmed",
          related_id: booking.id
        });
      } catch (e) {
        console.error("Failed to notify owner", e);
      }
    },
    onSuccess: () => {
      toast.success("Passeio aceite com sucesso!");
      queryClient.invalidateQueries(["openWalkBookings"]);
      queryClient.invalidateQueries(["myWalkBookings"]); // Update dashboard stats
    },
    onError: (err) => {
      toast.error("Erro ao aceitar pedido: " + err.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (openBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
        <MapPinOff className="w-12 h-12 mb-3 text-gray-200" />
        <p className="text-sm font-medium">Não há pedidos de passeio disponíveis no momento.</p>
        <p className="text-xs mt-1">Tenta novamente mais tarde ou verifica a tua área.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-900">
          Pedidos na tua zona
          <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {openBookings.length}
          </span>
        </h2>
        {userLocation && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            GPS Ativo
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {openBookings.map((booking) => (
          <WalkRequestCard
            key={booking.id}
            booking={booking}
            onAccept={acceptMutation.mutateAsync} // Pass async function
            userLocation={userLocation}
          />
        ))}
      </div>
    </div>
  );
}