import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation, StopCircle, AlertTriangle, Clock, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LiveMapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

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

export default function WalkerTracker({ bookingId: propBookingId }) {
  const { bookingId: paramBookingId } = useParams();
  const [queryBookingId] = useState(() => new URLSearchParams(window.location.search).get('bookingId'));
  
  const bookingId = propBookingId || queryBookingId || paramBookingId;
  const navigate = useNavigate();
  
  // ✅ PROTEÇÃO: Redirecionar se não houver bookingId
  useEffect(() => {
    if (!bookingId) {
      toast.error('ID da reserva não encontrado');
      navigate(createPageUrl('ProfessionalDashboard'), { replace: true });
    }
  }, [bookingId, navigate]);

  // Fetch current user for chat
  const { data: user } = useQuery({ 
    queryKey: ['currentUser'], 
    queryFn: () => base44.auth.me() 
  });

  const [isTracking, setIsTracking] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastPos, setLastPos] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  // Refs for closure-safe access in geolocation callback
  const distanceRef = useRef(0);
  const lastPosRef = useRef(null);
  const routeRef = useRef({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  });
  
  const watchId = useRef(null);
  const timerRef = useRef(null);

  // ✅ Buscar dados da reserva com WHERE id = bookingId
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      if (!bookings || bookings.length === 0) {
        throw new Error('Reserva não encontrada');
      }
      return bookings[0];
    },
    enabled: !!bookingId,
    retry: 1,
    refetchInterval: 5000 // Atualizar dados a cada 5s
  });

  // Initialize route from booking data if available
  useEffect(() => {
    if (booking?.route_coordinates && routeRef.current.geometry.coordinates.length === 0) {
      const coords = booking.route_coordinates.map(p => [p.lng, p.lat]);
      routeRef.current.geometry.coordinates = coords;
      if (booking.status === 'in_progress') {
        setIsTracking(true);
      }
    }
  }, [booking]);

  const updateMap = (lat, lng) => {
    setCurrentPosition([lat, lng]);
    setRoutePath(prev => [...prev, [lat, lng]]);
  };

  // Wake Lock Logic
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          toast("⚠️ Ecrã mantido ligado para GPS. Não feche esta aba.");
          lock.addEventListener('release', () => {
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

  // 3. Estado de Loading (Mostra Spinner enquanto carrega)
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500">A carregar dados do passeio...</p>
      </div>
    );
  }

  // 4. Tratamento de Erro
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

    // ✅ UPDATE COM WHERE id = bookingId
    base44.entities.Booking.update(bookingId, { 
      status: 'in_progress',
      walk_start_time: new Date().toISOString()
    })
      .then(() => toast.success("✅ Passeio iniciado! GPS ativo."))
      .catch(err => {
        console.error("Erro ao atualizar status:", err);
        toast.error("Erro ao iniciar passeio");
      });

    // Resume previous distance/route if continuing
    if (booking?.route_coordinates?.length > 0) {
      const lastPoint = booking.route_coordinates[booking.route_coordinates.length - 1];
      setLastPos(lastPoint);
      lastPosRef.current = lastPoint;
      
      // Resume distance if saved
      if (booking.distance_km) {
        const d = parseFloat(booking.distance_km) * 1000;
        setDistance(d);
        distanceRef.current = d;
      }
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

        // GPS Filter Logic (Accuracy < 30m)
        if (accuracy < 30) {
          let shouldUpdate = false;
          let dist = 0;

          const currentLastPos = lastPosRef.current;

          if (!currentLastPos) {
            shouldUpdate = true;
          } else {
            dist = getDistanceFromLatLonInM(currentLastPos.lat, currentLastPos.lng, latitude, longitude);
            // Only update if moved more than 10m
            if (dist > 10) {
              shouldUpdate = true;
            }
          }

          if (shouldUpdate) {
            // Update Refs and State
            lastPosRef.current = newPoint;
            setLastPos(newPoint);
            
            distanceRef.current += dist;
            setDistance(distanceRef.current);

            // Update Map Visuals
            updateMap(latitude, longitude);
            
            // ✅ PERSISTIR COM WHERE id = bookingId
            try {
              // Buscar rota atual para evitar sobrescrever
              const currentBooking = await base44.entities.Booking.filter({ id: bookingId }).then(r => r[0]);
              const updatedRoute = [...(currentBooking?.route_coordinates || []), newPoint];
              
              await base44.entities.Booking.update(bookingId, {
                walker_lat: latitude,
                walker_lng: longitude,
                route_coordinates: updatedRoute, 
                distance_km: (distanceRef.current / 1000).toFixed(2),
                last_update: new Date().toISOString()
              });
              
              console.log('💾 GPS atualizado no ride:', bookingId);
            } catch (err) {
              console.error("❌ Erro ao salvar GPS:", err);
              toast.error("Erro ao atualizar localização");
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

    // ✅ UPDATE COM WHERE id = bookingId
    try {
      await base44.entities.Booking.update(bookingId, {
        status: 'service_completed',
        completed_date: new Date().toISOString(),
        distance_km: (distance / 1000).toFixed(2)
      });
      
      toast.success("🎉 Passeio concluído! Bom trabalho.");
      setTimeout(() => {
        navigate(createPageUrl('ProfessionalDashboard'));
      }, 1500);
    } catch (error) {
      console.error("❌ Erro ao finalizar:", error);
      toast.error("Erro ao finalizar passeio");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Map Background */}
      <div className="flex-1 relative">
        <MapContainer
          center={currentPosition || [booking?.walker_lat || 38.7223, booking?.walker_lng || -9.1393]}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentPosition && <LiveMapUpdater center={currentPosition} />}
          {routePath.length > 1 && (
            <Polyline positions={routePath} pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.8 }} />
          )}
          {currentPosition && <Marker position={currentPosition} />}
        </MapContainer>
        
        {/* Top Bar Overlay */}
        <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {booking?.dog_name?.[0] || '🐶'}
            </div>
            <div>
              <div className="font-bold text-gray-900">{booking?.dog_name}</div>
              <div className="text-xs text-gray-500">{booking?.owner_name}</div>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => navigate(-1)}>
            <AlertTriangle className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-3xl relative -mt-6">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
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
            className="w-full h-14 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse transition-all duration-500 border-2 border-white/20"
            onClick={handleFinishWalk}
          >
            <span className="text-2xl">🐶</span>
            <span className="font-bold tracking-wide">Rastreando Cãozinho...</span>
            <span className="text-xs opacity-80 ml-1">(Toque para Encerrar)</span>
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

    </div>
  );
}