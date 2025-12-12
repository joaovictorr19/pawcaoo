import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Navigation, Euro } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to recenter map when center changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function InteractiveMap({ 
  walkers = [], 
  userLocation = null, 
  radiusKm = 10,
  onWalkerClick,
  onClose
}) {
  const navigate = useNavigate();
  const [selectedWalker, setSelectedWalker] = useState(null);
  
  // Find nearest walker to center map on them
  const nearestWalker = React.useMemo(() => {
    if (!userLocation || !walkers || walkers.length === 0) return null;
    
    const walkersWithDistance = walkers
      .filter(w => w.latitude && w.longitude)
      .map(w => ({
        ...w,
        dist: Math.sqrt(
          Math.pow(w.latitude - userLocation.lat, 2) + 
          Math.pow(w.longitude - userLocation.lng, 2)
        )
      }))
      .sort((a, b) => a.dist - b.dist);
    
    return walkersWithDistance[0] || null;
  }, [walkers, userLocation]);
  
  // Center on nearest walker if exists, otherwise user location, otherwise Lisboa
  const defaultCenter = [38.7223, -9.1393];
  const mapCenter = nearestWalker 
    ? [nearestWalker.latitude, nearestWalker.longitude]
    : (userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter);
  
  // Custom marker icon for walkers
  const walkerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  // User location icon
  const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const handleWalkerClick = (walker) => {
    setSelectedWalker(walker);
    if (onWalkerClick) {
      onWalkerClick(walker);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-200">
      {/* Close Button */}
      {onClose && (
        <Button
          onClick={onClose}
          size="sm"
          variant="secondary"
          className="absolute top-4 left-4 z-[1000] bg-white hover:bg-gray-100 shadow-lg"
        >
          ← Voltar
        </Button>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapUpdater center={mapCenter} zoom={13} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-blue-600">📍 Você está aqui</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Radius Circle */}
            <Circle
              center={userLocation}
              radius={radiusKm * 1000} // Convert km to meters
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
              }}
            />
          </>
        )}
        
        {/* Walker Markers with Service Areas */}
        {walkers.map((walker) => {
          const position = [
            walker.latitude || 38.7223,
            walker.longitude || 38.7223 + (Math.random() - 0.5) * 0.1
          ];
          
          const isNearest = nearestWalker && walker.id === nearestWalker.id;
          
          return (
            <React.Fragment key={walker.id}>
              <Marker
                position={position}
                icon={walkerIcon}
                eventHandlers={{
                  click: () => handleWalkerClick(walker)
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="ring-2 ring-green-400">
                        <AvatarImage src={walker.photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                          {walker.walker_name?.[0] || 'W'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{walker.walker_name}</h4>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{walker.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        {walker.location}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Euro className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">€{walker.hourly_rate}/hora</span>
                      </div>
                      {walker.distance && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          {walker.distance.toFixed(1)}km de distância
                        </div>
                      )}
                    </div>
                    
                    {walker.dog_sizes && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {walker.dog_sizes.map(size => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
                      onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                    >
                      Ver Perfil Completo
                    </Button>
                  </div>
                </Popup>
              </Marker>
              
              {/* Service Areas for each walker */}
              {walker.service_areas?.map((area, idx) => (
                area.latitude && area.longitude && area.radius_km && (
                  <Circle
                    key={`${walker.id}-area-${idx}`}
                    center={[area.latitude, area.longitude]}
                    radius={area.radius_km * 1000}
                    pathOptions={{
                      color: isNearest ? '#22c55e' : '#3b82f6',
                      fillColor: isNearest ? '#22c55e' : '#3b82f6',
                      fillOpacity: 0.08,
                      weight: isNearest ? 2.5 : 1.5,
                      dashArray: isNearest ? '5, 5' : '10, 10'
                    }}
                  />
                )
              ))}
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-xl p-3 z-[1000]">
        <h4 className="font-bold text-sm mb-2">Legenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Você</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Passeadores ({walkers.length})</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-purple-500 rounded-full"></div>
              <span>Raio {radiusKm}km</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Walker Count Badge */}
      <div className="absolute top-4 right-4 bg-white rounded-xl shadow-xl px-4 py-2 z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-gray-900">{walkers.length} disponíveis</span>
        </div>
      </div>
    </div>
  );
}