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
 * - POLLING a cada 15s para economizar bateria Android
 */

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
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
  
  const intervalIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  if (!rideId) {
    console.error('⚠️ useRideTracker: rideId é obrigatório!');
    return { location: null, isTracking: false, error: 'No rideId provided', distance: 0 };
  }

  const fetchAndUpdateLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy >= 30) {
            console.log('⚠️ GPS impreciso, ignorando:', accuracy, 'm');
            return;
        }

        const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString(), accuracy };
        const currentLast = lastPosRef.current;
        let movedDistance = 0;
        
        if (currentLast) {
          movedDistance = getDistanceInMeters(currentLast.lat, currentLast.lng, latitude, longitude);
          if (movedDistance < 10) return; // Só atualiza se moveu mais de 10m
        }

        lastPosRef.current = newPoint;
        setLocation(newPoint);
        distanceRef.current += movedDistance;
        setDistance(distanceRef.current);

        try {
          const currentRide = await base44.entities.Booking.filter({ id: rideId }).then(r => r[0]);
          const updatedRoute = [...(currentRide?.route_coordinates || []), newPoint];
          
          await base44.entities.Booking.update(rideId, {
            walker_lat: latitude,
            walker_lng: longitude,
            route_coordinates: updatedRoute,
            distance_km: (distanceRef.current / 1000).toFixed(2),
            last_update: new Date().toISOString()
          });

          // Atualizar WalkerProfile pawgo_status (se disponível o user email)
          if (currentRide?.walker_email) {
             const walkers = await base44.entities.WalkerProfile.filter({ created_by: currentRide.walker_email });
             if (walkers.length > 0) {
                await base44.entities.WalkerProfile.update(walkers[0].id, {
                    pawgo_status: {
                       ...(walkers[0].pawgo_status || {}),
                       current_location: { lat: latitude, lng: longitude },
                       last_active: new Date().toISOString(),
                       is_online: true
                    }
                });
             }
          }
        } catch (err) {
          console.error('❌ Erro ao salvar coordenada:', err);
        }
      },
      (err) => {
        console.error('❌ GPS Error:', err);
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      const err = 'GPS não suportado neste dispositivo';
      setError(err);
      toast.error(err);
      return;
    }

    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        toast.success('📍 Rastreamento ativo - ecrã mantido ligado');
      }
    } catch (e) {
      console.warn('Wake Lock não disponível:', e);
    }

    try {
      const booking = await base44.entities.Booking.filter({ id: rideId }).then(r => r[0]);
      await base44.entities.Booking.update(rideId, { 
        status: 'in_progress',
        walk_start_time: new Date().toISOString()
      });

      if (booking?.owner_email || booking?.created_by) {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email || booking.created_by,
          title: '🚀 Passeio Iniciado!',
          message: `O passeio com ${booking.dog_name} começou. Acompanhe em tempo real!`,
          type: 'booking',
          related_id: rideId,
          priority: 'high',
          action_url: `/LiveWalkTracking?id=${rideId}`
        });
      }
      
      if (booking?.route_coordinates?.length > 0) {
        const lastPoint = booking.route_coordinates[booking.route_coordinates.length - 1];
        lastPosRef.current = lastPoint;
        setLocation(lastPoint);
        if (booking.distance_km) {
          distanceRef.current = parseFloat(booking.distance_km) * 1000;
          setDistance(distanceRef.current);
        }
      }
    } catch (err) {
      console.error('Erro ao iniciar ride:', err);
      toast.error('Erro ao atualizar status do passeio');
      return;
    }

    setIsTracking(true);
    fetchAndUpdateLocation();
    intervalIdRef.current = setInterval(fetchAndUpdateLocation, 15000);
  };

  const stopTracking = async () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (e) {}
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
    distance: distance / 1000,
    startTracking,
    stopTracking,
    finishRide
  };
}

export default useRideTracker;