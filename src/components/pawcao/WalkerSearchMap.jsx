import React, { useState, useRef, useEffect } from 'react';
import { Map, MapControls, MapMarker, MapRoute, MarkerContent } from "@/components/ui/map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, PawPrint, User } from "lucide-react";
import maplibregl from 'maplibre-gl';

// Dados simulados (depois virão do seu Banco de Dados)
const WALKER_POS = [-9.1393, 38.7223]; // Lisboa Centro
const DOG_POS = [-9.1450, 38.7280];    // Um pouco mais a norte

export function WalkerSearchMap() {
  const [routeInfo, setRouteInfo] = useState({ distance: "1.2 km", duration: "12 min" });
  const mapRef = useRef(null);

  const handleMapLoad = (map) => {
    mapRef.current = map;
    
    // Fit Bounds: Automatically zoom to fit both points
    if (window.maplibregl || maplibregl) {
        const bounds = new (window.maplibregl || maplibregl).LngLatBounds();
        bounds.extend(WALKER_POS);
        bounds.extend(DOG_POS);
        
        map.fitBounds(bounds, {
            padding: { top: 50, bottom: 200, left: 50, right: 50 }, // Extra bottom padding for the card
            maxZoom: 16,
            duration: 1000
        });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* MAPA */}
      <Map
        center={WALKER_POS}
        zoom={14}
        className="w-full h-full"
        onMapLoad={handleMapLoad}
      >
        {/* 1. ROTA (Linha Azul) */}
        <MapRoute
          coordinates={[WALKER_POS, DOG_POS]}
          color="#2563EB"
          width={4}
          opacity={0.8}
        />

        {/* 2. MARCADOR DO PASSEADOR (Você/Walker) */}
        <MapMarker longitude={WALKER_POS[0]} latitude={WALKER_POS[1]}>
          <MarkerContent>
            <div className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2">
              <User className="w-5 h-5 text-white" />
            </div>
          </MarkerContent>
        </MapMarker>

        {/* 3. MARCADOR DO CÃO (Destino) */}
        <MapMarker longitude={DOG_POS[0]} latitude={DOG_POS[1]}>
          <MarkerContent>
            <div className="bg-amber-500 p-2 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
          </MarkerContent>
        </MapMarker>

        <MapControls position="top-right" />
      </Map>

      {/* 4. CARD FLUTUANTE (Correção do Layout Mobile) 
         'bottom-24' levanta o card para cima da TabBar do telemóvel
         'z-50' garante que fica por cima do mapa 
      */}
      <div className="absolute bottom-24 left-4 right-4 z-50">
        <Card className="p-4 bg-white/95 backdrop-blur shadow-2xl border-0 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Recolha de Thor</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Navigation size={14} /> 
                {routeInfo.distance} • {routeInfo.duration} até ao local
              </p>
            </div>
            {/* Foto pequena do cão (opcional) */}
            <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
               <img src="https://github.com/shadcn.png" alt="Dog" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl h-auto">
              Iniciar Rota
            </Button>
            <Button variant="outline" className="py-6 rounded-xl border-2 h-auto">
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}