import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, ZoomIn, ZoomOut, Locate } from "lucide-react";

export default function ActiveServiceMap({ booking, currentUserEmail }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const pickupMarker = useRef(null);
  const walkerMarker = useRef(null);

  const isProfessional = currentUserEmail === booking.walker_email || currentUserEmail === booking.trainer_email;
  const isActive = booking.status === 'in_progress';

  useEffect(() => {
    if (!booking?.pickup_lat || !booking?.pickup_lng || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [booking.pickup_lng, booking.pickup_lat],
      zoom: 14,
    });

    // Add pickup marker
    const pickupEl = document.createElement('div');
    pickupEl.className = 'w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer';
    pickupEl.innerHTML = `
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    `;

    pickupMarker.current = new maplibregl.Marker({ element: pickupEl })
      .setLngLat([booking.pickup_lng, booking.pickup_lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2 text-xs font-semibold">📍 ${booking.pickup_address?.split(',')[0] || 'Recolha'}</div>`
        )
      )
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [booking?.pickup_lat, booking?.pickup_lng]);

  // Update walker marker when location changes
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
      walkerEl.className = 'relative';
      walkerEl.innerHTML = `
        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      `;

      walkerMarker.current = new maplibregl.Marker({ element: walkerEl })
        .setLngLat([booking.walker_lng, booking.walker_lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2 text-xs font-semibold text-blue-600">🚶 ${isProfessional ? 'Você' : 'Profissional'}</div>`
          )
        )
        .addTo(map.current);
    }
  }, [booking?.walker_lat, booking?.walker_lng, isActive, isProfessional]);

  if (!booking?.pickup_lat || !booking?.pickup_lng) return null;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-white/30 relative">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
          onClick={() => map.current?.zoomIn()}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
          onClick={() => map.current?.zoomOut()}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        {isProfessional && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  map.current?.flyTo({
                    center: [position.coords.longitude, position.coords.latitude],
                    zoom: 15,
                  });
                });
              }
            }}
          >
            <Locate className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Action - Route */}
      {isProfessional && (
        <div className="absolute bottom-2 left-2 right-2">
          <Button
            size="sm"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`;
              window.open(mapsUrl, '_blank');
            }}
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