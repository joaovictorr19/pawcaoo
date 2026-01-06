import React, { useState, useRef, useEffect } from 'react';
import { Map, MapMarker, MarkerContent, MapPopup } from '@/components/ui/map';
import MapControls from '@/components/ui/MapControls';
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }) {
  const mapRef = useRef(null);
  const [selectedWalker, setSelectedWalker] = useState(null);

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleLocate = (coords) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 14,
        duration: 1500
      });
    }
  };

  // Fly to user location on mount if available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 2000
      });
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
      <Map
        initialViewState={{
          longitude: userLocation?.lng || -9.1393,
          latitude: userLocation?.lat || 38.7223,
          zoom: 12,
        }}
        className="w-full h-full"
        onMapLoad={handleMapLoad}
      >
        <MapControls
          position="top-right"
          showZoom={true}
          showCompass={true}
          showLocate={true}
          onLocate={handleLocate}
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
            <MarkerContent>
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                <div className="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
              </div>
            </MarkerContent>
          </MapMarker>
        )}

        {/* Walkers Markers */}
        {walkers.map((walker) => (
          <MapMarker
            key={walker.id}
            longitude={walker.longitude || 0}
            latitude={walker.latitude || 0}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedWalker(walker);
              
              // Center map on click slightly offset to show popup
              if(mapRef.current) {
                mapRef.current.flyTo({
                  center: [walker.longitude, walker.latitude],
                  zoom: 15,
                  duration: 1000,
                  offset: [0, 100] // Shift center down so popup (which opens up) is visible
                });
              }
            }}
          >
            <MarkerContent>
               <div className="relative group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50">
                  <div className={`w-10 h-10 rounded-full border-[3px] shadow-lg overflow-hidden bg-white ${selectedWalker?.id === walker.id ? 'border-green-500 scale-110' : 'border-white'}`}>
                    <img 
                      src={walker.photo_url || "/placeholder-user.jpg"} 
                      alt={walker.walker_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                    {walker.hourly_rate}€
                  </div>
               </div>
            </MarkerContent>
          </MapMarker>
        ))}

        {/* Popup for Selected Walker */}
        {selectedWalker && (
          <MapPopup
            longitude={selectedWalker.longitude}
            latitude={selectedWalker.latitude}
            onClose={() => setSelectedWalker(null)}
            closeButton={true}
            closeOnClick={false}
            offset={25}
            className="z-50"
          >
            <div className="p-3 min-w-[240px] max-w-[280px]" onClick={() => onWalkerClick && onWalkerClick(selectedWalker)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <img src={selectedWalker.photo_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight mb-1">{selectedWalker.walker_name}</h3>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold ml-1 text-gray-700">{selectedWalker.rating}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">• {selectedWalker.experience_years} anos exp.</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{selectedWalker.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg italic">
                  "{selectedWalker.bio}"
                </p>
                
                <div className="flex gap-1 flex-wrap">
                  {selectedWalker.services_offered?.slice(0, 2).map((s, i) => (
                    <span key={i} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                      {s.service_name}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                  <div>
                    <span className="text-xs text-gray-500">A partir de</span>
                    <div className="font-bold text-green-600 text-sm">{selectedWalker.hourly_rate}€<span className="text-xs font-normal text-gray-500">/h</span></div>
                  </div>
                  <Badge className="bg-gray-900 hover:bg-gray-800 text-white text-xs px-3 py-1 cursor-pointer">
                    Ver Perfil
                  </Badge>
                </div>
              </div>
            </div>
          </MapPopup>
        )}
      </Map>
    </div>
  );
}