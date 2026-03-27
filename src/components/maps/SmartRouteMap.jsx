import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Clock, Route, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const START_POS = { name: "Ponto de Partida", lng: 4.9041, lat: 52.3676 };
const END_POS = { name: "Destino", lng: 4.4777, lat: 51.9244 };

export function SmartRouteMap() {
  const [routes, setRoutes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${START_POS.lng},${START_POS.lat};${END_POS.lng},${END_POS.lat}?overview=full&geometries=geojson&alternatives=true`
        );
        const data = await response.json();
        if (data.routes?.length > 0) {
          setRoutes(data.routes.map((route) => ({
            // OSRM returns [lng, lat] — convert to [lat, lng] for Leaflet
            positions: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            duration: route.duration,
            distance: route.distance,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden border shadow-xl">
      <MapContainer
        center={[START_POS.lat, START_POS.lng]}
        zoom={9}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routes.map((route, index) => (
          <Polyline
            key={index}
            positions={route.positions}
            pathOptions={{
              color: index === selectedIndex ? '#4f46e5' : '#cbd5e1',
              weight: index === selectedIndex ? 6 : 4,
              opacity: index === selectedIndex ? 1 : 0.6,
            }}
            eventHandlers={{ click: () => setSelectedIndex(index) }}
          />
        ))}

        <Marker position={[START_POS.lat, START_POS.lng]} />
        <Marker position={[END_POS.lat, END_POS.lng]} />
      </MapContainer>

      {/* Route Selector */}
      <div className="absolute top-4 left-4 w-72 z-[400] flex flex-col gap-2">
        {isLoading ? (
          <Card className="p-4 flex items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" />
            <span className="text-sm font-medium">Calculando melhor rota...</span>
          </Card>
        ) : (
          routes.map((route, index) => (
            <Button
              key={index}
              variant={index === selectedIndex ? "default" : "secondary"}
              className={`w-full justify-between h-auto py-3 px-4 shadow-md ${
                index === selectedIndex ? "bg-slate-900 text-white" : "bg-white/90 text-slate-800 hover:bg-white"
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
              {index === 0 && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/20 text-green-700 px-2 py-1 rounded">
                  Rápido
                </span>
              )}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}