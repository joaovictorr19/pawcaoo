import React from 'react';
import { ActiveWalkMap as NewActiveWalkMap } from '@/components/pawcao/ActiveWalkMap';

export default function ActiveWalkMap({ currentLocation, pathHistory = [], startLocation }) {
  // Convert pathHistory to MapLibre format: [[lng, lat], ...]
  const convertedPath = pathHistory.map(point => {
    // Handle both {lat, lng} and [lat, lng] formats
    if (Array.isArray(point)) {
      return [point[1], point[0]]; // [lat, lng] -> [lng, lat]
    }
    return [point.lng, point.lat];
  });

  const currentLoc = currentLocation || { lat: 38.7223, lng: -9.1393 };

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-md">
      <NewActiveWalkMap 
        currentLocation={currentLoc}
        pathHistory={convertedPath}
        startLocation={startLocation}
      />
    </div>
  );
}