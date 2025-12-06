import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export default function ServiceAreaMap({ walker }) {
  // Default center (Lisboa) or walker's main location
  const defaultCenter = [38.7223, -9.1393];
  const mapCenter = (walker?.latitude && walker?.longitude) 
    ? [walker.latitude, walker.longitude] 
    : defaultCenter;

  const walkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-md border border-gray-200 z-0">
      <MapContainer
        center={mapCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <MapUpdater center={mapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Main Location Marker */}
        {walker?.latitude && walker?.longitude && (
          <Marker position={[walker.latitude, walker.longitude]} icon={walkerIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-gray-900">{walker.walker_name}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Base Location
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Service Areas */}
        {walker?.service_areas?.map((area, idx) => {
          // Use area coordinates if available, otherwise fallback to main walker coordinates
          const center = (area.latitude && area.longitude) 
            ? [area.latitude, area.longitude]
            : (walker.latitude && walker.longitude ? [walker.latitude, walker.longitude] : null);

          if (!center || !area.radius_km) return null;

          return (
            <Circle
              key={idx}
              center={center}
              radius={area.radius_km * 1000} // km to meters
              pathOptions={{
                color: '#16a34a', // green-600
                fillColor: '#22c55e', // green-500
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-gray-900">{area.area_name}</p>
                  <Badge className="mt-1 bg-green-100 text-green-700 border-0 text-[10px]">
                    Raio: {area.radius_km}km
                  </Badge>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
      
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 opacity-20 border border-green-600 rounded-full"></div>
          <span className="font-medium text-gray-700">Área de Serviço</span>
        </div>
      </div>
    </div>
  );
}