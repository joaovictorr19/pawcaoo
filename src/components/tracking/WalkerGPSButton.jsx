import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Navigation, Loader2, StopCircle } from "lucide-react";
import { toast } from "sonner";

// Haversine formula
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
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

export default function WalkerGPSButton({ bookingId, currentBooking, className }) {
  // If className provided, use it (relative). If not, fallback to fixed bottom (absolute) for legacy use.
  const containerClass = className 
    ? className 
    : "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[500] w-full px-4 flex justify-center";

  const [isTracking, setIsTracking] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [distance, setDistance] = useState(0);
  
  const distanceRef = useRef(0);
  const lastPosRef = useRef(null);
  const watchId = useRef(null);

  // Restore state if booking is already in progress
  useEffect(() => {
    if (currentBooking?.status === 'in_progress') {
        setIsTracking(true);
        if (currentBooking.distance_km) {
            const d = parseFloat(currentBooking.distance_km) * 1000;
            setDistance(d);
            distanceRef.current = d;
        }
        if (currentBooking.route_coordinates?.length > 0) {
            lastPosRef.current = currentBooking.route_coordinates[currentBooking.route_coordinates.length - 1];
        }
    }
  }, [currentBooking]);

  // Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isTracking) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
        }
      } catch (err) {
        console.error("Wake Lock Error:", err);
      }
    };
    if (isTracking) requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isTracking]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("GPS não suportado.");
      return;
    }

    setIsTracking(true);
    base44.entities.Booking.update(bookingId, { status: 'in_progress' });
    toast.success("GPS Ativado! Cliente a ver.");

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

        if (accuracy < 30) {
          let shouldUpdate = false;
          let dist = 0;
          const currentLastPos = lastPosRef.current;

          if (!currentLastPos) {
            shouldUpdate = true;
          } else {
            dist = getDistanceFromLatLonInM(currentLastPos.lat, currentLastPos.lng, latitude, longitude);
            if (dist > 10) shouldUpdate = true;
          }

          if (shouldUpdate) {
            lastPosRef.current = newPoint;
            distanceRef.current += dist;
            setDistance(distanceRef.current);

            try {
              // Fetch latest to append safely? Or just trust linear append for now to be fast
              // Ideally we'd use a backend push, but here we read-modify-write
              // We'll trust the component's last known state or minimal update
              // For robustness in this specific interaction:
              const freshBooking = await base44.entities.Booking.get(bookingId);
              const updatedRoute = [...(freshBooking?.route_coordinates || []), newPoint];
              
              await base44.entities.Booking.update(bookingId, {
                route_coordinates: updatedRoute,
                distance_km: (distanceRef.current / 1000).toFixed(2)
              });
            } catch (err) {
              console.error("GPS Update Error", err);
            }
          }
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = async () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    setIsTracking(false);
    if (wakeLock) await wakeLock.release();
    
    // Optional: Mark as completed or just pause? 
    // Usually "Finish" is a separate action. This just stops GPS.
    // But prompt implies "Ativar". Let's assume it toggles or stays on.
    toast.info("GPS Pausado.");
  };

  return (
    <div className={containerClass}>
      {!isTracking ? (
        <Button 
          onClick={startTracking}
          className="bg-green-600 hover:bg-green-700 text-white shadow-xl rounded-full px-6 py-6 h-auto text-lg font-bold animate-bounce"
        >
          <Navigation className="w-6 h-6 mr-2" />
          📡 Ativar Minha Localização
        </Button>
      ) : (
        <Button 
          onClick={stopTracking}
          variant="secondary"
          className="bg-white/90 text-red-600 hover:bg-white shadow-xl rounded-full px-6 py-4 h-auto border-2 border-red-100"
        >
          <StopCircle className="w-5 h-5 mr-2" />
          Parar GPS ({(distance / 1000).toFixed(2)} km)
        </Button>
      )}
    </div>
  );
}