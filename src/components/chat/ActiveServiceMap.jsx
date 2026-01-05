import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';

export default function ActiveServiceMap({ booking, currentUserEmail }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const pickupMarkerRef = useRef(null);
  const walkerMarkerRef = useRef(null);

  useEffect(() => {
    if (map.current) return; 

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [booking.pickup_lng || -9.1393, booking.pickup_lat || 38.7223],
      zoom: 14
    });

    map.current.on('load', () => {
      console.log('🗺️ Map loaded for booking:', booking.id);
      setMapLoaded(true);

      // Marcador da casa do dono (verde - destino)
      if (booking.pickup_lat && booking.pickup_lng) {
        const el = document.createElement('div');
        el.className = 'w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer';
        el.innerHTML = '🏠';
        el.style.fontSize = '20px';
        
        pickupMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([booking.pickup_lng, booking.pickup_lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`<div class="p-2"><strong>Local de Recolha</strong><br/>${booking.pickup_address || 'Casa do dono'}</div>`)
          )
          .addTo(map.current);
      }

      // Marcador do walker (azul - posição atual)
      if (booking.walker_lat && booking.walker_lng) {
        const el = document.createElement('div');
        el.className = 'relative';
        el.innerHTML = `
          <div class="absolute -inset-2 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
          <div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
        `;
        
        walkerMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([booking.walker_lng, booking.walker_lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`<div class="p-2"><strong>${booking.walker_name || 'Passeador'}</strong><br/>Posição atual</div>`)
          )
          .addTo(map.current);

        // Desenhar rota se ambas posições existem
        if (booking.pickup_lat && booking.pickup_lng) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [booking.walker_lng, booking.walker_lat],
                  [booking.pickup_lng, booking.pickup_lat]
                ]
              }
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-dasharray': [2, 2]
            }
          });

          // Ajustar zoom para mostrar ambos marcadores
          const bounds = new maplibregl.LngLatBounds()
            .extend([booking.walker_lng, booking.walker_lat])
            .extend([booking.pickup_lng, booking.pickup_lat]);
          
          map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [booking.id]);

  // Atualizar posição do walker em tempo real
  useEffect(() => {
    if (!mapLoaded || !booking.walker_lat || !booking.walker_lng || !walkerMarkerRef.current) return;

    walkerMarkerRef.current.setLngLat([booking.walker_lng, booking.walker_lat]);

    // Atualizar rota se existir
    if (map.current?.getSource('route') && booking.pickup_lat && booking.pickup_lng) {
      map.current.getSource('route').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [booking.walker_lng, booking.walker_lat],
            [booking.pickup_lng, booking.pickup_lat]
          ]
        }
      });
    }
  }, [booking.walker_lat, booking.walker_lng, mapLoaded]);

  const isProfessional = currentUserEmail === booking.walker_email || currentUserEmail === booking.trainer_email;

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/20 shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
          <span className="font-medium text-gray-700">Casa do dono</span>
        </div>
        {booking.walker_lat && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
            <span className="font-medium text-gray-700">Passeador</span>
          </div>
        )}
      </div>

      {/* Botão Google Maps */}
      {isProfessional && booking.pickup_lat && booking.pickup_lng && (
        <Button
          size="sm"
          onClick={() => {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`;
            window.open(mapsUrl, '_blank');
          }}
          className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white border-0 h-8 px-3 text-xs shadow-lg"
        >
          <Navigation className="w-3 h-3 mr-1" />
          Abrir Rota
        </Button>
      )}
    </div>
  );
}