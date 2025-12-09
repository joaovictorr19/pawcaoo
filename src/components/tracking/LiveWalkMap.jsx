import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";

// --- CUSTOM ICONS ---
const dogIconConfig = {
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png", // Cute dog icon
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -48],
  className: "drop-shadow-xl"
};

const startIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- SUB-COMPONENT FOR MAP UPDATES ---
const LiveMapViewer = ({ path }) => {
  const map = useMap();
  const markerRef = React.useRef(null);

  // Smoothly update marker and view
  useEffect(() => {
    if (!path || path.length === 0) return;

    const lastPoint = path[path.length - 1];
    const newLatLng = [lastPoint.lat, lastPoint.lng];

    // 1. Update Marker smoothly (Native Leaflet)
    if (!markerRef.current) {
      // Create if doesn't exist
      const icon = L.icon(dogIconConfig);
      markerRef.current = L.marker(newLatLng, { icon }).addTo(map);
      markerRef.current.bindPopup("Woof! Estamos aqui! 🐾").openPopup();
    } else {
      // Update position
      markerRef.current.setLatLng(newLatLng);
      // Optional: Update popup content or keep it open
    }

    // 2. Pan map smoothly
    map.setView(newLatLng, map.getZoom(), { animate: true, duration: 1.0 });

    // Cleanup on unmount (only if component unmounts, not on every render)
    return () => {
      // We don't remove marker here to avoid flickering if parent re-renders, 
      // but strictly we should if the component is destroyed.
      // For this use case, we want persistent marker.
    };
  }, [path, map]);

  if (!path || path.length === 0) return null;

  const polylinePositions = path.map(p => [p.lat, p.lng]);

  return (
    <>
      <Polyline 
        positions={polylinePositions} 
        pathOptions={{ color: '#8b5cf6', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round', dashArray: '1, 10', dashOffset: '10' }} 
      />
      <Marker position={[path[0].lat, path[0].lng]} icon={startIcon} />
      {/* Dog marker is handled by useEffect for smoothness */}
    </>
  );
};

// --- MAIN COMPONENT ---
export default function LiveWalkMap({ bookingId, walkerId, className }) {
  // Estilos inline forçados para evitar override global
  const forcedStyles = {
    width: '100%',
    height: '100%',
    minHeight: '100%',
    position: 'relative',
    zIndex: 1
  };
  React.useEffect(() => {
      if (bookingId) {
          console.log("LiveWalkMap Mounted. IDs:", { bookingId, walkerId });
      }
  }, [bookingId, walkerId]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['liveBookingMap', bookingId],
    queryFn: async () => {
       const res = await base44.entities.Booking.filter({ id: bookingId });
       return res[0];
    },
    refetchInterval: 5000, // 5s refresh
    enabled: !!bookingId,
  });

  if (!bookingId) return (
    <div className={`flex items-center justify-center bg-gray-50 text-gray-500 flex-col gap-2 ${className}`}>
      <span className="text-sm">ID de reserva não fornecido</span>
    </div>
  );

  if (isLoading) return (
    <div className={`flex items-center justify-center bg-gray-50 text-gray-500 gap-2 ${className}`}>
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="text-sm">Carregando mapa...</span>
    </div>
  );

  if (!booking) return (
    <div className={`flex items-center justify-center bg-gray-50 text-gray-500 flex-col gap-2 ${className}`}>
      <span className="font-bold">Reserva não encontrada</span>
    </div>
  );

  const path = booking.route_coordinates || [];
  // Default to Lisbon or path start
  const center = path.length > 0 ? [path[path.length - 1].lat, path[path.length - 1].lng] : [38.7223, -9.1393];

  return (
    <div className={className} style={forcedStyles}>
      <MapContainer 
        center={center} 
        zoom={16} 
        zoomControl={false}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LiveMapViewer path={path} />
      </MapContainer>
      
      {/* Mini Info Overlay */}
      <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium">
         Distância: {booking.distance_km ? booking.distance_km.toFixed(2) : 0} km
      </div>
    </div>
  );
}