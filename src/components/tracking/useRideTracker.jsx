import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Hook de Rastreamento GPS Vinculado ao RideId
 * 
 * REGRA DE INTEGRIDADE:
 * - Nunca grave coordenadas sem WHERE id = rideId
 * - Nunca inicie rastreamento sem um rideId válido
 * - Atualiza apenas quando movimentação > 10m + accuracy < 30m
 */

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
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

function useRideTracker(rideId) {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(0);
  
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);
  const wakeLockRef = useRef(null);

  // ✅ PROTEÇÃO: Sem rideId, não faz nada
  if (!rideId) {
    console.error('⚠️ useRideTracker: rideId é obrigatório!');
    return { location: null, isTracking: false, error: 'No rideId provided', distance: 0 };
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const startTracking = async () => {
    if (!navigator.geolocation) {
      const err = 'GPS não suportado neste dispositivo';
      setError(err);
      toast.error(err);
      return;
    }

    // Request Wake Lock
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        toast.success('📍 Rastreamento ativo - ecrã mantido ligado');
      }
    } catch (e) {
      console.warn('Wake Lock não disponível:', e);
    }

    // ✅ ATUALIZAR STATUS DA RESERVA PARA "in_progress"
    try {
      await base44.entities.Booking.update(rideId, { 
        status: 'in_progress',
        walk_start_time: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao iniciar ride:', err);
      toast.error('Erro ao atualizar status do passeio');
      return;
    }

    setIsTracking(true);
    
    // Carregar coordenadas existentes (se retomando passeio)
    try {
      const ride = await base44.entities.Booking.filter({ id: rideId }).then(r => r[0]);
      if (ride?.route_coordinates?.length > 0) {
        const lastPoint = ride.route_coordinates[ride.route_coordinates.length - 1];
        lastPosRef.current = lastPoint;
        setLocation(lastPoint);
        
        if (ride.distance_km) {
          const d = parseFloat(ride.distance_km) * 1000;
          distanceRef.current = d;
          setDistance(d);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar coordenadas:', err);
    }

    // ✅ INICIAR WATCHPOSITION
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // ✅ FILTRO DE PRECISÃO: Apenas accuracy < 30m
        if (accuracy >= 30) {
          console.log('⚠️ GPS impreciso, ignorando:', accuracy, 'm');
          return;
        }

        const newPoint = {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString(),
          accuracy
        };

        // ✅ FILTRO DE DISTÂNCIA: Apenas movimentação > 10m
        const currentLast = lastPosRef.current;
        let movedDistance = 0;
        
        if (currentLast) {
          movedDistance = getDistanceInMeters(
            currentLast.lat, 
            currentLast.lng, 
            latitude, 
            longitude
          );
          
          if (movedDistance < 10) {
            console.log('📍 Movimento < 10m, ignorando');
            return;
          }
        }

        // ✅ ATUALIZAÇÃO VÁLIDA
        console.log('✅ Coordenada válida:', movedDistance.toFixed(1), 'm');
        
        lastPosRef.current = newPoint;
        setLocation(newPoint);
        
        distanceRef.current += movedDistance;
        setDistance(distanceRef.current);

        // ✅ PERSISTIR NO BANCO COM WHERE id = rideId
        try {
          // Buscar rota atual do servidor (evitar sobrescrever)
          const currentRide = await base44.entities.Booking.filter({ id: rideId }).then(r => r[0]);
          const updatedRoute = [...(currentRide?.route_coordinates || []), newPoint];
          
          await base44.entities.Booking.update(rideId, {
            walker_lat: latitude,
            walker_lng: longitude,
            route_coordinates: updatedRoute,
            distance_km: (distanceRef.current / 1000).toFixed(2),
            last_update: new Date().toISOString()
          });
          
          console.log('💾 Coordenada salva no ride:', rideId);
        } catch (err) {
          console.error('❌ Erro ao salvar coordenada:', err);
          toast.error('Erro ao atualizar localização');
        }
      },
      (err) => {
        console.error('❌ GPS Error:', err);
        setError(err.message);
        toast.error('Erro no GPS: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (e) {
        console.error('Erro ao liberar wake lock:', e);
      }
    }

    setIsTracking(false);
    toast.info('📍 Rastreamento pausado');
  };

  const finishRide = async () => {
    await stopTracking();
    
    try {
      await base44.entities.Booking.update(rideId, {
        status: 'service_completed',
        completed_date: new Date().toISOString(),
        distance_km: (distanceRef.current / 1000).toFixed(2)
      });
      
      toast.success('🎉 Passeio concluído com sucesso!');
    } catch (err) {
      console.error('Erro ao finalizar ride:', err);
      toast.error('Erro ao finalizar passeio');
      throw err;
    }
  };

  return {
    location,
    isTracking,
    error,
    distance: distance / 1000, // retorna em km
    startTracking,
    stopTracking,
    finishRide
  };
};