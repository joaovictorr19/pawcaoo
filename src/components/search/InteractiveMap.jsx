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
import { X } from "lucide-react";

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
  const [currentWalkerIndex, setCurrentWalkerIndex] = useState(0);
  
  // Get valid walkers with coordinates
  const validWalkers = React.useMemo(() => 
    walkers.filter(w => w.latitude && w.longitude),
    [walkers]
  );
  
  // Current focused walker
  const focusedWalker = validWalkers[currentWalkerIndex] || null;
  
  // Navigate to next walker
  const goToNextWalker = () => {
    setCurrentWalkerIndex((prev) => (prev + 1) % validWalkers.length);
  };
  
  // Center on focused walker or user location or Lisboa
  const defaultCenter = [38.7223, -9.1393];
  const mapCenter = focusedWalker 
    ? [focusedWalker.latitude, focusedWalker.longitude]
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
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-100 shadow-lg rounded-full h-10 w-10"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <MapUpdater center={mapCenter} zoom={14} />
        
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
              
              {/* Service Areas - only show for focused walker */}
              {focusedWalker && walker.id === focusedWalker.id && walker.service_areas?.map((area, idx) => (
                area.latitude && area.longitude && area.radius_km && (
                  <Circle
                    key={`${walker.id}-area-${idx}`}
                    center={[area.latitude, area.longitude]}
                    radius={area.radius_km * 1000}
                    pathOptions={{
                      color: '#22c55e',
                      fillColor: '#22c55e',
                      fillOpacity: 0.15,
                      weight: 3,
                      dashArray: '5, 5'
                    }}
                  />
                )
              ))}
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Interactive Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-xl p-3 z-[1000] max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm">Explorar Passeadores</h4>
          {validWalkers.length > 0 && (
            <span className="text-xs text-gray-500">{currentWalkerIndex + 1}/{validWalkers.length}</span>
          )}
        </div>
        
        {focusedWalker ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <Avatar className="h-8 w-8 ring-2 ring-green-400">
                <AvatarImage src={focusedWalker.photo_url} />
                <AvatarFallback className="bg-green-600 text-white text-xs">
                  {focusedWalker.walker_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-gray-900 truncate">{focusedWalker.walker_name}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{focusedWalker.rating?.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">• €{focusedWalker.hourly_rate}/h</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={goToNextWalker}
              size="sm"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white h-8 text-xs"
              disabled={validWalkers.length <= 1}
            >
              Próximo Passeador →
            </Button>
          </div>
        ) : (
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Você</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Passeadores ({walkers.length})</span>
            </div>
          </div>
        )}
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