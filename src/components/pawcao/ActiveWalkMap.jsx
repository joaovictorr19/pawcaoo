import React, { useEffect, useRef } from 'react';
import { Map } from '@/components/ui/map';
import maplibregl from 'maplibre-gl';
import { Dog, MapPin } from 'lucide-react';

export function ActiveWalkMap({ 
  currentLocation = { lat: 38.7223, lng: -9.1393 },
  pathHistory = [],
  startLocation = null
}) {
  const mapRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);

  const handleMapLoad = (map) => {
    mapRef.current = map;

    // Add the path source
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pathHistory.length > 0 ? pathHistory : [[currentLocation.lng, currentLocation.lat]]
        }
      }
    });

    // Add the path layer
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2563eb',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });

    // Create START marker (green)
    const startPoint = startLocation || (pathHistory.length > 0 ? 
      { lng: pathHistory[0][0], lat: pathHistory[0][1] } : 
      currentLocation);

    const startMarkerEl = document.createElement('div');
    startMarkerEl.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.5);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `;

    startMarkerRef.current = new maplibregl.Marker({ 
      element: startMarkerEl,
      anchor: 'bottom'
    })
      .setLngLat([startPoint.lng, startPoint.lat])
      .addTo(map);

    // Create CURRENT marker (walker - blue with dog icon)
    const currentMarkerEl = document.createElement('div');
    currentMarkerEl.style.cssText = `
      width: 50px;
      height: 50px;
      position: relative;
    `;
    
    currentMarkerEl.innerHTML = `
      <div style="
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6);
        border: 4px solid white;
        animation: pulse-walker 2s infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/>
          <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>
          <path d="M8 14v.5"/>
          <path d="M16 14v.5"/>
          <path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/>
          <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 12px solid #2563eb;
      "></div>
    `;

    // Add pulse animation
    if (!document.getElementById('pulse-walker-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pulse-walker-keyframes';
      style.textContent = `
        @keyframes pulse-walker {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6), 0 0 0 0 rgba(37, 99, 235, 0.7);
          }
          50% {
            box-shadow: 0 4px 20px rgba(37, 99, 235, 0.8), 0 0 0 10px rgba(37, 99, 235, 0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    currentMarkerRef.current = new maplibregl.Marker({ 
      element: currentMarkerEl,
      anchor: 'bottom'
    })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(map);

    // Center map on current location
    map.flyTo({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 15,
      duration: 1000
    });
  };

  // Update path when pathHistory changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const source = map.getSource('route');

    if (source && pathHistory.length > 0) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pathHistory
        }
      });
    }
  }, [pathHistory]);

  // Update current marker position with smooth animation
  useEffect(() => {
    if (!currentMarkerRef.current || !mapRef.current) return;

    // Animate marker to new position
    currentMarkerRef.current.setLngLat([currentLocation.lng, currentLocation.lat]);

    // Auto-center map on walker (smoothly)
    mapRef.current.easeTo({
      center: [currentLocation.lng, currentLocation.lat],
      duration: 1000
    });
  }, [currentLocation]);

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{
          longitude: currentLocation.lng,
          latitude: currentLocation.lat,
          zoom: 15,
        }}
        className="w-full h-full rounded-xl"
        onMapLoad={handleMapLoad}
      />

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Dog className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Passeio em Curso</p>
            <p className="text-lg font-bold text-gray-900">
              {(pathHistory.length * 0.02).toFixed(2)} km
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Início</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Walker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-600 rounded"></div>
            <span className="text-gray-700">Trajeto</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
// OSRM Integration (commented out for future use)
// 
// const calculateRemainingDistance = async (currentLat, currentLng, destinationLat, destinationLng) => {
//   try {
//     const response = await fetch(
//       `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLng},${destinationLat}?overview=false`
//     );
//     const data = await response.json();
//     if (data.routes && data.routes[0]) {
//       const distanceKm = (data.routes[0].distance / 1000).toFixed(2);
//       return distanceKm;
//     }
//   } catch (error) {
//     console.error('OSRM error:', error);
//   }
//   return null;
// };
*/