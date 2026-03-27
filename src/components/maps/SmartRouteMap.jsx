import React, { useEffect, useState } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MapRoute,
  MarkerLabel,
} from "@/components/ui/map.jsx";
import { Loader2, Clock, Route, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Helpers
function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Configuração Inicial (Exemplo: Amsterdam -> Rotterdam)
// TODO: No futuro, receber isto via props
const START_POS = { name: "Ponto de Partida", lng: 4.9041, lat: 52.3676 };
const END_POS = { name: "Destino", lng: 4.4777, lat: 51.9244 };

export function SmartRouteMap() {
  const [routes, setRoutes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch de Rotas Reais (OSRM)
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${START_POS.lng},${START_POS.lat};${END_POS.lng},${END_POS.lat}?overview=full&geometries=geojson&alternatives=true`
        );
        const data = await response.json();

        if (data.routes?.length > 0) {
          const routeData = data.routes.map((route) => ({
            coordinates: route.geometry.coordinates,
            duration: route.duration,
            distance: route.distance,
          }));
          setRoutes(routeData);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  // Ordenar rotas para que a selecionada fique sempre "por cima" visualmente
  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden border shadow-xl">
      <Map 
        center={[START_POS.lng, START_POS.lat]} 
        zoom={9}
        className="w-full h-full"
      >
        {/* 1. CONTROLES DO MAPA (Integrado) */}
        <MapControls
          position="bottom-right"
          showZoom={true}
          showCompass={true}
          showLocate={true}
          showFullscreen={true}
        />

        {/* 2. DESENHO DAS LINHAS DE ROTA */}
        {sortedRoutes.map(({ route, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={index}
              coordinates={route.coordinates}
              color={isSelected ? "#4f46e5" : "#cbd5e1"} // Indigo vs Slate-300
              width={isSelected ? 6 : 4}
              opacity={isSelected ? 1 : 0.6}
              onClick={() => setSelectedIndex(index)}
            />
          );
        })}

        {/* 3. MARCADORES DE INÍCIO E FIM */}
        <MapMarker longitude={START_POS.lng} latitude={START_POS.lat}>
          <MarkerContent>
            <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
               <Navigation size={12} className="text-white" />
            </div>
            <MarkerLabel position="top" className="font-bold">{START_POS.name}</MarkerLabel>
          </MarkerContent>
        </MapMarker>

        <MapMarker longitude={END_POS.lng} latitude={END_POS.lat}>
          <MarkerContent>
            <div className="h-6 w-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
            <MarkerLabel position="bottom" className="font-bold">{END_POS.name}</MarkerLabel>
          </MarkerContent>
        </MapMarker>
      </Map>

      {/* 4. UI FLUTUANTE: SELETOR DE ROTAS */}
      <div className="absolute top-4 left-4 w-72 z-10 flex flex-col gap-2">
        {isLoading ? (
             <Card className="p-4 flex items-center gap-2">
               <Loader2 className="animate-spin text-blue-600" />
               <span className="text-sm font-medium">Calculando melhor rota...</span>
             </Card>
        ) : (
          routes.map((route, index) => {
            const isActive = index === selectedIndex;
            const isFastest = index === 0; // OSRM geralmente retorna a mais rápida primeiro
            
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "secondary"}
                className={`w-full justify-between h-auto py-3 px-4 shadow-md backdrop-blur-md ${
                  isActive ? "bg-slate-900 text-white" : "bg-white/90 text-slate-800 hover:bg-white"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Clock size={14} />
                    {formatDuration(route.duration)}
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                    <Route size={12} />
                    {formatDistance(route.distance)}
                  </div>
                </div>
                
                {isFastest && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/20 text-green-700 px-2 py-1 rounded">
                    Rápido
                  </span>
                )}
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}