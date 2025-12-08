import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, MapPin, Navigation, StopCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getDistance } from "geolib"; // Assuming geolib or custom helper

// Simple Haversine formula if geolib is not installed
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export default function WalkerTracker({ bookingId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [wakeLock, setWakeLock] = useState(null);
  const [path, setPath] = useState([]);
  const watchId = useRef(null);
  const lastUpdateRef = useRef(null);

  // Fetch Booking
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => base44.entities.Booking.filter({ id: bookingId }).then(res => res[0]),
    enabled: !!bookingId
  });

  // Wake Lock API
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        toast.info("Ecrã mantido ligado para GPS");
        
        lock.addEventListener('release', () => {
          console.log('Wake Lock released');
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  // Start Tracking
  const startTracking = async () => {
    await requestWakeLock();
    setIsTracking(true);
    
    if (!navigator.geolocation) {
      toast.error("GPS não suportado neste dispositivo.");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // 1. Accuracy Check (< 20m preferred)
        if (accuracy > 30) return; // Skip inaccurate points

        const newPoint = { 
          lat: latitude, 
          lng: longitude, 
          timestamp: new Date().toISOString() 
        };

        setCurrentPos(newPoint);

        // 2. Distance Check (> 10m from last saved point)
        let shouldUpdate = false;
        if (!lastUpdateRef.current) {
          shouldUpdate = true;
        } else {
          const dist = calculateDistance(
            lastUpdateRef.current.lat, lastUpdateRef.current.lng,
            latitude, longitude
          );
          if (dist > 10) {
            shouldUpdate = true;
            setTotalDistance(prev => prev + dist);
          }
        }

        if (shouldUpdate) {
          lastUpdateRef.current = newPoint;
          setPath(prev => {
            const newPath = [...prev, newPoint];
            // Update Backend
            updateRoute(newPath);
            return newPath;
          });
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const updateRoute = async (newPath) => {
    if (!bookingId) return;
    await base44.entities.Booking.update(bookingId, {
      route_coordinates: newPath
    });
  };

  const stopTracking = async () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    if (wakeLock) await wakeLock.release();
    setIsTracking(false);
    
    // Finalize Booking Logic here
    await base44.entities.Booking.update(bookingId, {
      status: 'service_completed',
      completed_date: new Date().toISOString()
    });
    toast.success("Passeio finalizado com sucesso!");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      toast.loading("Enviando foto...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create Checkpoint / Message
      await base44.entities.WalkCheckpoint.create({
        booking_id: bookingId,
        walker_email: booking.walker_email,
        checkpoint_type: "photo_update",
        photo_url: file_url,
        latitude: currentPos?.lat || 0,
        longitude: currentPos?.lng || 0,
        timestamp: new Date().toISOString()
      });

      toast.dismiss();
      toast.success("Foto enviada para o chat!");
    } catch (err) {
      toast.error("Erro ao enviar foto");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Status Card */}
      <Card className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-mono text-sm uppercase tracking-wider">
              {isTracking ? "GRAVANDO GPS" : "PARADO"}
            </span>
          </div>
          {wakeLock && <span className="text-[10px] text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Screen Lock</span>}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold font-mono">
              {(totalDistance / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 uppercase">Quilómetros</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono">
              {path.length}
            </div>
            <div className="text-xs text-slate-400 uppercase">Waypoints</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          className="h-24 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl relative overflow-hidden"
          onClick={() => document.getElementById('cameraInput').click()}
        >
          <Camera className="w-8 h-8" />
          <span className="font-bold">FOTO</span>
          <input 
            id="cameraInput" 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </Button>

        {!isTracking ? (
          <Button 
            className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
            onClick={startTracking}
          >
            <Navigation className="w-8 h-8" />
            <span className="font-bold">INICIAR</span>
          </Button>
        ) : (
          <Button 
            className="h-24 flex flex-col gap-2 bg-red-600 hover:bg-red-700 rounded-xl animate-pulse"
            onClick={stopTracking}
          >
            <StopCircle className="w-8 h-8" />
            <span className="font-bold">TERMINAR</span>
          </Button>
        )}
      </div>
    </div>
  );
}