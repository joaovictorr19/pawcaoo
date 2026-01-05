import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

export default function ActiveServiceMap({ booking, currentUserEmail }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const pickupMarker = useRef(null);
  const walkerMarker = useRef(null);

  const isProfessional = currentUserEmail === booking.walker_email || currentUserEmail === booking.trainer_email;
  const isActive = booking.status === 'in_progress';

  useEffect(() => {
    if (!booking?.pickup_lat || !booking?.pickup_lng || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [booking.pickup_lng, booking.pickup_lat],
      zoom: 14,
    });

    const pickupEl = document.createElement('div');
    pickupEl.className = 'w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer';
    pickupEl.innerHTML = `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

    pickupMarker.current = new maplibregl.Marker({ element: pickupEl })
      .setLngLat([booking.pickup_lng, booking.pickup_lat])
      .addTo(map.current);

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [booking?.pickup_lat, booking?.pickup_lng]);

  useEffect(() => {
    if (!map.current || !isActive || !booking.walker_lat || !booking.walker_lng) {
      if (walkerMarker.current) {
        walkerMarker.current.remove();
        walkerMarker.current = null;
      }
      return;
    }

    if (walkerMarker.current) {
      walkerMarker.current.setLngLat([booking.walker_lng, booking.walker_lat]);
    } else {
      const walkerEl = document.createElement('div');
      walkerEl.innerHTML = `<div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg></div>`;

      walkerMarker.current = new maplibregl.Marker({ element: walkerEl })
        .setLngLat([booking.walker_lng, booking.walker_lat])
        .addTo(map.current);
    }
  }, [booking?.walker_lat, booking?.walker_lng, isActive]);

  if (!booking?.pickup_lat || !booking?.pickup_lng) return null;

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-white/30">
      <div ref={mapContainer} className="w-full h-full" />
      {isProfessional && (
        <div className="absolute bottom-2 left-2 right-2">
          <Button
            size="sm"
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`, '_blank')}
            className="w-full bg-white/95 hover:bg-white text-gray-900 shadow-lg h-9"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Rota Google Maps
          </Button>
        </div>
      )}
    </div>
  );
}