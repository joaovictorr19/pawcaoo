import React, { useState, useEffect, useRef } from 'react';
import { Map, Marker } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dog, Camera, Droplet, Circle, Play, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layer, Source } from 'react-map-gl/maplibre';

const eventIcons = {
  pee: { icon: '💦', label: 'Xixi', color: 'bg-blue-500' },
  poo: { icon: '💩', label: 'Cocó', color: 'bg-amber-600' },
  photo: { icon: '📷', label: 'Foto', color: 'bg-purple-500' },
  play: { icon: '🎾', label: 'Brincar', color: 'bg-green-500' },
};

const ActiveWalkMap = ({ 
  currentLocation, 
  pathHistory = [], 
  eventMarkers = [],
  onAddEvent 
}) => {
  const [showFAB, setShowFAB] = useState(false);
  const mapRef = useRef(null);

  // Auto-center on current location
  useEffect(() => {
    if (currentLocation?.lat && currentLocation?.lng && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        duration: 1000,
      });
    }
  }, [currentLocation]);

  // Convert path history to GeoJSON LineString
  const pathGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: pathHistory.map(point => [point.lng, point.lat])
    }
  };

  const handleAddEvent = (eventType) => {
    if (currentLocation?.lat && currentLocation?.lng) {
      onAddEvent({
        type: eventType,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        timestamp: new Date().toISOString()
      });
      setShowFAB(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: currentLocation?.lng || -8.6291,
          latitude: currentLocation?.lat || 41.1579,
          zoom: 16,
        }}
      >
        {/* Route Line */}
        {pathHistory.length > 1 && (
          <Source id="route" type="geojson" data={pathGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3B82F6',
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Current Location Marker */}
        {currentLocation?.lat && currentLocation?.lng && (
          <Marker
            longitude={currentLocation.lng}
            latitude={currentLocation.lat}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <div className="bg-blue-600 rounded-full p-3 shadow-2xl border-4 border-white">
                <Dog className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </motion.div>
          </Marker>
        )}

        {/* Event Markers */}
        {eventMarkers.map((event, idx) => (
          <Marker
            key={`event-${idx}`}
            longitude={event.lng}
            latitude={event.lat}
          >
            <div className={`${eventIcons[event.type]?.color || 'bg-gray-500'} rounded-full p-2 shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform`}>
              <span className="text-xl">{eventIcons[event.type]?.icon || '📍'}</span>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Floating Action Button Menu */}
      <div className="absolute bottom-6 right-6 z-10">
        <AnimatePresence>
          {showFAB && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-3 mb-3"
            >
              {Object.entries(eventIcons).map(([type, { icon, label, color }]) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddEvent(type)}
                  className={`${color} text-white rounded-full p-4 shadow-lg flex items-center gap-2 font-semibold`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="pr-2">{label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFAB(!showFAB)}
          className={`${showFAB ? 'bg-red-600' : 'bg-blue-600'} text-white rounded-full p-4 shadow-2xl transition-colors`}
        >
          {showFAB ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Walk Stats Overlay */}
      <Card className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm border-0 shadow-xl p-3 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 rounded-lg p-2">
              <Dog className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Passeio Ativo</p>
              <p className="font-bold text-sm text-gray-900">
                {pathHistory.length > 0 ? `${(pathHistory.length * 0.01).toFixed(2)} km` : '0.00 km'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {Object.entries(eventIcons).map(([type, { icon }]) => {
              const count = eventMarkers.filter(e => e.type === type).length;
              return count > 0 ? (
                <div key={type} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-bold text-gray-700">{count}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActiveWalkMap;