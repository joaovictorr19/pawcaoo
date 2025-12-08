import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import ChatOverlay from "./ChatOverlay";

// --- CUSTOM ICONS ---
// Placeholder Icon as requested
/* TODO: TROCAR ESTA URL PELO ÍCONE PIXEL ART DO CÃO */
const dogIcon = new L.Icon({
  iconUrl: "https://placehold.co/40x40/purple/white?text=DOG",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: "rounded-full border-2 border-white shadow-lg"
});

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- SUB-COMPONENTS ---

const LiveMapViewer = ({ path }) => {
  const map = useMap();

  useEffect(() => {
    if (path && path.length > 0) {
      const lastPoint = path[path.length - 1];
      map.setView([lastPoint.lat, lastPoint.lng], map.getZoom(), { animate: true });
    }
  }, [path, map]);

  if (!path || path.length === 0) return null;

  const polylinePositions = path.map(p => [p.lat, p.lng]);
  const currentPos = path[path.length - 1];

  return (
    <>
      <Polyline 
        positions={polylinePositions} 
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} 
      />
      <Marker position={[path[0].lat, path[0].lng]} icon={startIcon} />
      <Marker position={[currentPos.lat, currentPos.lng]} icon={dogIcon} />
    </>
  );
};

// ChatWindow removed in favor of ChatOverlay
// ... existing map components ...

// --- MAIN COMPONENT ---

export default function LiveWalkSession({ bookingId }) {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: booking, isLoading } = useQuery({
    queryKey: ['liveBooking', bookingId],
    queryFn: () => base44.entities.Booking.filter({ id: bookingId }).then(res => res[0]),
    refetchInterval: 5000, // 5s refresh
    enabled: !!bookingId, // Só busca se tiver ID
  });

  if (!bookingId) return (
    <div className="h-screen w-screen flex items-center justify-center bg-red-50 text-red-600 flex-col gap-2">
      <AlertTriangle className="w-8 h-8" />
      <span className="font-bold">Reserva não especificada</span>
    </div>
  );

  if (isLoading || !user) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500 gap-2">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      Carregando mapa...
    </div>
  );

  if (!booking) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500 flex-col gap-2">
      <span className="font-bold">Reserva não encontrada</span>
      <span className="text-sm">Aguardando dados...</span>
    </div>
  );

  const path = booking.route_coordinates || [];
  // Default to Lisbon or path start
  const center = path.length > 0 ? [path[path.length - 1].lat, path[path.length - 1].lng] : [38.7223, -9.1393];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      
      {/* Z-Index 0: Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={center} 
          zoom={16} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <LiveMapViewer path={path} />
        </MapContainer>
      </div>

      {/* Top Overlay Info (Optional but good for UX) */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg flex justify-between items-center max-w-sm mx-auto pointer-events-auto">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
            <p className="text-sm font-semibold text-green-600 animate-pulse">● Em andamento</p>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-gray-500 uppercase">Passeador</p>
             <p className="text-sm font-semibold">{booking.walker_name}</p>
          </div>
        </div>
      </div>

      {/* Z-Index 20: Chat Overlay */}
      <ChatOverlay bookingId={bookingId} user={user} title="Chat com Passeador" />
      
    </div>
  );
}