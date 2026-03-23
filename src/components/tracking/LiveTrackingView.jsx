import React, { useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Dog, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiveTrackingView({ walkerCoords, routeHistory, destination, dogName, distanceToHome }) {
  const mapRef = useRef();

  // 1. Definição da Linha de Rastro (Histórico do GPS)
  const routeData = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: (routeHistory || []).map(p => [p.lng, p.lat]) // Array de [lng, lat] vindo do banco em tempo real
    }
  };

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: walkerCoords?.lng || -8.6291,
          latitude: walkerCoords?.lat || 41.1579,
          zoom: 15
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" // Style clean tipo Uber
      >
        {/* Rastro do Passeio */}
        {routeHistory && routeHistory.length > 0 && (
            <Source id="route-source" type="geojson" data={routeData}>
            <Layer
                id="route-layer"
                type="line"
                paint={{
                'line-color': '#f97316', // Laranja PawCão
                'line-width': 5,
                'line-cap': 'round',
                'line-join': 'round',
                'line-dasharray': [1, 2] // Efeito pontilhado charmoso
                }}
            />
            </Source>
        )}

        {/* Ícone do Passeador (O Uber) */}
        {walkerCoords && walkerCoords.lat && walkerCoords.lng && (
            <Marker longitude={walkerCoords.lng} latitude={walkerCoords.lat} anchor="bottom">
            <div className="relative">
                <div className="bg-orange-500 p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
                <Dog className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            </Marker>
        )}

        {/* Destino Final (Se houver) */}
        {destination && destination.lat && destination.lng && (
          <Marker longitude={destination.lng} latitude={destination.lat}>
            <MapPin className="w-8 h-8 text-red-500 fill-red-200" />
          </Marker>
        )}

        <NavigationControl position="top-right" />
      </Map>
      
      {/* Card Flutuante de Status */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Navigation className="w-6 h-6 text-orange-600 animate-pulse" />
            </div>
            <div>
                <p className="text-[10px] uppercase font-black text-orange-600 tracking-widest">Em Trânsito</p>
                <p className="font-bold text-gray-900 text-sm">
                  {dogName ? `O ${dogName} está em passeio` : 'O cão está em passeio'} 
                  {distanceToHome ? ` a ${distanceToHome}` : ''}
                </p>
            </div>
         </div>
         <Button size="sm" className="rounded-full bg-black text-white text-xs hover:bg-gray-800">SOS</Button>
      </div>
    </div>
  );
}