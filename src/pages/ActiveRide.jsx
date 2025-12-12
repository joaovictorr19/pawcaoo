import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Navigation, 
  StopCircle, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  MapPin,
  CheckCircle,
  Phone,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import useRideTracker from '../components/tracking/useRideTracker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FinishRideModal from '../components/tracking/FinishRideModal';

/**
 * ✅ PÁGINA DE RASTREAMENTO COM INTEGRIDADE DE DADOS
 * 
 * ARQUITETURA:
 * 1. Roteamento: /ride/:id/track (ID obrigatório na URL)
 * 2. Proteção: Sem ID válido → Redirect para Dashboard
 * 3. Hook Vinculado: useRideTracker(rideId) com UPDATE WHERE id
 * 4. Realtime: Subscrição Supabase filtrada por rideId
 */

// Ícones personalizados para o mapa
const dogIcon = new L.Icon({
  iconUrl: 'https://placehold.co/40x40/8b5cf6/white?text=🐕',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'rounded-full border-2 border-white shadow-lg'
});

const startIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const homeIcon = new L.Icon({
  iconUrl: 'https://placehold.co/40x40/10b981/white?text=🏠',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'rounded-full border-2 border-white shadow-lg'
});

// ✅ Haversine para calcular distância até o destino
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// Componente para centralizar mapa em tempo real
const MapCenterController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 17, { animate: true });
    }
  }, [center, map]);
  
  return null;
};

export default function ActiveRide() {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [distanceToDestination, setDistanceToDestination] = useState(null);

  // ✅ PROTEÇÃO 1: ID obrigatório na URL
  useEffect(() => {
    if (!rideId) {
      console.error('⚠️ Nenhum rideId na URL, redirecionando...');
      toast.error('ID do passeio não encontrado');
      navigate(createPageUrl('ProfessionalDashboard'), { replace: true });
    }
  }, [rideId, navigate]);

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // ✅ PROTEÇÃO 2: Buscar reserva com ID específico
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['activeRide', rideId],
    queryFn: async () => {
      const rides = await base44.entities.Booking.filter({ id: rideId });
      if (!rides || rides.length === 0) {
        throw new Error('Reserva não encontrada');
      }
      return rides[0];
    },
    enabled: !!rideId,
    retry: 1,
    refetchInterval: 5000 // Atualizar a cada 5s para ver updates do walker
  });

  // ✅ HOOK DE RASTREAMENTO VINCULADO
  const { 
    location, 
    isTracking, 
    distance, 
    startTracking, 
    stopTracking, 
    finishRide 
  } = useRideTracker(rideId);

  // ✅ Mutation para finalizar passeio com backend
  const finishRideMutation = useMutation({
    mutationFn: async ({ photoUrl, forcedFinishReason, actualDistance }) => {
      const response = await base44.functions.invoke('finishRide', {
        rideId,
        photoUrl,
        forcedFinishReason,
        actualDistance
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('🎉 Passeio finalizado!');
      queryClient.invalidateQueries(['activeRide', rideId]);
      queryClient.invalidateQueries(['myWalkBookings']);
      setTimeout(() => {
        navigate(createPageUrl('ProfessionalDashboard'));
      }, 1500);
    },
    onError: (error) => {
      console.error('Erro:', error);
      toast.error('Erro ao finalizar');
    }
  });

  // Timer para duração do passeio
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // Formatação de tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle finish com confirmação
  const handleFinish = async () => {
    if (!showFinishConfirm) {
      setShowFinishConfirm(true);
      return;
    }

    try {
      await finishRide();
      toast.success('Passeio concluído! Redirecionando...');
      setTimeout(() => {
        navigate(createPageUrl('ProfessionalDashboard'));
      }, 2000);
    } catch (err) {
      toast.error('Erro ao finalizar');
    }
  };

  // ✅ PROTEÇÃO 3: Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600 font-semibold">A carregar dados do passeio...</p>
        <p className="text-sm text-gray-500 mt-2">Ride ID: {rideId}</p>
      </div>
    );
  }

  // ✅ PROTEÇÃO 4: Error State (ID inválido ou reserva não existe)
  if (error || !booking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Reserva Não Encontrada</h2>
        <p className="text-gray-600 mb-2">
          Não foi possível carregar o passeio com ID: <code className="bg-red-100 px-2 py-1 rounded">{rideId}</code>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {error?.message || 'Verifique se o ID está correto ou se a reserva foi cancelada.'}
        </p>
        <Button onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  // ✅ PROTEÇÃO 5: Verificar se o usuário é o walker da reserva
  const isWalker = user?.email === booking.walker_email;
  if (!isWalker) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-yellow-50 p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-6">
          Você não é o passeador desta reserva.
        </p>
        <Button onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  // Preparar dados do mapa
  const routePath = booking.route_coordinates || [];
  const mapCenter = location 
    ? [location.lat, location.lng]
    : routePath.length > 0 
    ? [routePath[routePath.length - 1].lat, routePath[routePath.length - 1].lng]
    : [38.7223, -9.1393]; // Lisboa default

  // ✅ Calcular distância até o destino em tempo real
  useEffect(() => {
    if (location && booking?.pickup_lat && booking?.pickup_lng) {
      const dist = calculateDistance(
        location.lat,
        location.lng,
        booking.pickup_lat,
        booking.pickup_lng
      );
      setDistanceToDestination(dist);
    }
  }, [location, booking?.pickup_lat, booking?.pickup_lng]);

  // ✅ Coordenadas do destino (Casa do cliente)
  const destinationCoords = booking?.pickup_lat && booking?.pickup_lng
    ? [booking.pickup_lat, booking.pickup_lng]
    : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* ✅ MAPA DE FUNDO (Z-INDEX 0) */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={17} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapCenterController center={mapCenter} />
          
          {/* Desenhar rota percorrida */}
          {routePath.length > 0 && (
            <>
              <Polyline 
                positions={routePath.map(p => [p.lat, p.lng])}
                pathOptions={{ 
                  color: '#8b5cf6', 
                  weight: 5, 
                  opacity: 0.8,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              <Marker position={[routePath[0].lat, routePath[0].lng]} icon={startIcon} />
            </>
          )}
          
          {/* Posição atual do cachorro */}
          {location && (
            <Marker position={[location.lat, location.lng]} icon={dogIcon} />
          )}
          
          {/* 🏠 Destino: Casa do Cliente */}
          {destinationCoords && (
            <Marker position={destinationCoords} icon={homeIcon} />
          )}
        </MapContainer>
      </div>

      {/* ✅ TOP BAR: Informações da Reserva (Z-INDEX 10) */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 max-w-2xl mx-auto pointer-events-auto">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {booking.dog_name?.charAt(0) || '🐕'}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{booking.dog_name}</h3>
                <p className="text-sm text-gray-600">{booking.owner_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isTracking && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-green-700">AO VIVO</span>
                </div>
              )}
              
              {booking.owner_phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${booking.owner_phone}`)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ✅ BOTTOM CONTROLS: Rastreamento e Estatísticas (Z-INDEX 50) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-purple-500 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pb-safe">
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-900 font-mono">{formatTime(duration)}</div>
              <div className="text-[10px] text-blue-600 font-semibold">Duração</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Navigation className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-900">{distance.toFixed(2)}</div>
              <div className="text-[10px] text-green-600 font-semibold">Km Total</div>
            </div>
            
            {/* ✅ DISTÂNCIA ATÉ O DESTINO */}
            {destinationCoords && distanceToDestination !== null && (
              <div className={`text-center p-3 rounded-xl ${
                distanceToDestination < 50 
                  ? 'bg-gradient-to-br from-orange-50 to-red-100 animate-pulse' 
                  : 'bg-gradient-to-br from-yellow-50 to-yellow-100'
              }`}>
                <MapPin className={`w-4 h-4 mx-auto mb-1 ${
                  distanceToDestination < 50 ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div className={`text-xl font-bold ${
                  distanceToDestination < 50 ? 'text-red-900' : 'text-yellow-900'
                }`}>
                  {distanceToDestination < 1000 
                    ? `${Math.round(distanceToDestination)}m`
                    : `${(distanceToDestination / 1000).toFixed(1)}km`
                  }
                </div>
                <div className={`text-[10px] font-semibold ${
                  distanceToDestination < 50 ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {distanceToDestination < 50 ? '🏠 CHEGANDO!' : 'Até Casa'}
                </div>
              </div>
            )}
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <MapPin className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-900">{routePath.length}</div>
              <div className="text-[10px] text-purple-600 font-semibold">Pontos GPS</div>
            </div>
          </div>

          {/* Botões de Controle */}
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3"
            >
              <Navigation className="w-6 h-6" />
              INICIAR RASTREAMENTO
            </Button>
          ) : (
            <Button
              onClick={() => setShowFinishModal(true)}
              disabled={!destinationCoords}
              className={`w-full h-16 text-lg font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all ${
                distanceToDestination !== null && distanceToDestination < 50
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse'
                  : distanceToDestination !== null && distanceToDestination < 200
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
              } text-white`}
            >
              <Camera className="w-6 h-6" />
              {distanceToDestination !== null && distanceToDestination < 50
                ? 'ENTREGAR E FINALIZAR'
                : distanceToDestination !== null && distanceToDestination < 200
                ? `${Math.round(distanceToDestination)}m DO DESTINO`
                : 'LONGE DO DESTINO'}
            </Button>
          )}
          
          {/* Info de Localização */}
          {location && (
            <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>
                Precisão: {location.accuracy?.toFixed(0)}m | 
                Última atualização: {format(new Date(location.timestamp), 'HH:mm:ss')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ CONFIRMAÇÃO DE SAÍDA */}
      {isTracking && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
            ⚠️ Rastreamento ativo - Não feche a app
          </div>
        </div>
      )}

      {/* Modal de Finalização */}
      <FinishRideModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        booking={booking}
        distanceToDestination={distanceToDestination}
        onConfirm={async (data) => {
          await finishRideMutation.mutateAsync(data);
          setShowFinishModal(false);
        }}
      />
    </div>
  );
}