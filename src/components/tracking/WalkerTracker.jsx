import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation, StopCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Haversine formula for distance in meters
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

export default function WalkerTracker() {
  // 1. Pegar o ID da URL
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [isTracking, setIsTracking] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastPos, setLastPos] = useState(null);
  
  const watchId = useRef(null);
  const timerRef = useRef(null);

  // 2. Buscar dados da reserva (Protegido)
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => base44.entities.Booking.filter({ id: bookingId }).then(res => res[0]),
    enabled: !!bookingId, // Só busca se o ID existir na URL
    retry: 1
  });

  // 3. Estado de Loading (Mostra Spinner enquanto carrega)
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500">A carregar dados do passeio...</p>
      </div>
    );
  }

  // 4. Tratamento de Erro (Se o ID for inválido ou a reserva não existir)
  if (!booking || error || !bookingId) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Reserva não encontrada</h2>
        <p className="text-gray-600 mb-6">
          Não foi possível identificar o passeio (ID: {bookingId || 'Não especificado'}).
        </p>
        <Button onClick={() => navigate(createPageUrl('ProfessionalDashboard'))} variant="outline">
          Voltar aos Agendamentos
        </Button>
      </div>
    );
  }

  // Wake Lock Logic
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          toast("⚠️ Ecrã mantido ligado para GPS. Não feche esta aba.");
          
          lock.addEventListener('release', () => {
            console.log('Wake Lock released');
            setWakeLock(null);
          });
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTracking]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("GPS não suportado.");
      return;
    }

    setIsTracking(true);
    
    // Resume previous distance/route if continuing (simplified here to start fresh/append)
    if (booking?.route_coordinates?.length > 0) {
      const lastPoint = booking.route_coordinates[booking.route_coordinates.length - 1];
      setLastPos(lastPoint);
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

        // GPS Filter Logic
        if (accuracy < 30) {
          let shouldUpdate = false;
          let dist = 0;

          if (!lastPos) {
            shouldUpdate = true;
          } else {
            dist = getDistanceFromLatLonInM(lastPos.lat, lastPos.lng, latitude, longitude);
            if (dist > 10) {
              shouldUpdate = true;
            }
          }

          if (shouldUpdate) {
            setLastPos(newPoint);
            setDistance(prev => prev + dist);
            
            // Optimistic update to local state could happen here
            // Persist to backend
            try {
              // We need to fetch current route first or rely on backend push if available (using standard update here)
              // In a real high-freq scenario, we might batch these or use a specialized endpoint.
              // For this demo, we append to the array.
              const currentRoute = booking?.route_coordinates || [];
              const updatedRoute = [...currentRoute, newPoint];
              
              await base44.entities.Booking.update(bookingId, {
                route_coordinates: updatedRoute
              });
            } catch (err) {
              console.error("Failed to update location", err);
            }
          }
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFinishWalk = async () => {
    if (!window.confirm("Tem certeza que deseja encerrar o passeio?")) return;

    // 1. Stop GPS
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    setIsTracking(false);
    clearInterval(timerRef.current);

    // 2. Release Wake Lock
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
      } catch (e) {
        console.error("Wake Lock release error", e);
      }
    }

    // 3. Update Booking
    try {
      await base44.entities.Booking.update(bookingId, {
        status: 'completed',
        completed_date: new Date().toISOString(), // Using completed_date as end_time
        distance_km: (distance / 1000).toFixed(2)
      });
      
      toast.success("Passeio concluído! Bom trabalho.");
      navigate(createPageUrl('ProfessionalDashboard'));
    } catch (error) {
      console.error("Error finishing walk:", error);
      toast.error("Erro ao finalizar passeio. Tente novamente.");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Status Display */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-2xl font-mono font-bold text-gray-800">{formatTime(duration)}</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 uppercase font-bold">Distância</div>
            <div className="text-xl font-bold text-blue-600">{(distance / 1000).toFixed(2)} km</div>
          </div>
        </div>

        {/* Controls */}
        {!isTracking ? (
          <Button 
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 rounded-xl shadow-lg flex items-center justify-center gap-2"
            onClick={startTracking}
          >
            <Navigation className="w-6 h-6" />
            INICIAR PASSEIO
          </Button>
        ) : (
          <Button 
            className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse"
            onClick={handleFinishWalk}
          >
            <StopCircle className="w-6 h-6" />
            Terminar Passeio
          </Button>
        )}
        
        {wakeLock && (
          <div className="text-center text-xs text-orange-500 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Ecrã mantido ligado para GPS
          </div>
        )}
      </div>
    </div>
  );
}