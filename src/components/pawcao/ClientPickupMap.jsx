import React, { useEffect, useRef } from 'react';
import { Map } from '@/components/ui/map';
import maplibregl from 'maplibre-gl';
import { Home, Dog, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClientPickupMap({ 
  pickupLocation = { 
    lat: 38.7223, 
    lng: -9.1393, 
    address: 'Lisboa, Portugal',
    clientName: 'Cliente' 
  } 
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const handleMapLoad = (map) => {
    mapRef.current = map;
    
    // Create custom marker element
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-marker';
    markerEl.style.width = '50px';
    markerEl.style.height = '50px';
    markerEl.style.cursor = 'pointer';
    
    // Create the icon circle
    markerEl.innerHTML = `
      <div style="
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
        border: 3px solid white;
        position: relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid #16a34a;
      "></div>
    `;

    // Create popup content
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pickupLocation.lat},${pickupLocation.lng}`;
    
    const popupContent = document.createElement('div');
    popupContent.style.padding = '12px';
    popupContent.style.minWidth = '250px';
    popupContent.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="font-weight: 700; font-size: 16px; color: #1f2937; margin-bottom: 4px;">
          🐕 ${pickupLocation.clientName}
        </div>
        <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
          📍 ${pickupLocation.address}
        </div>
      </div>
      <a 
        href="${googleMapsUrl}" 
        target="_blank" 
        rel="noopener noreferrer"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #16a34a;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='#15803d'"
        onmouseout="this.style.background='#16a34a'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        Abrir no Google Maps
      </a>
    `;

    // Create popup
    const popup = new maplibregl.Popup({ 
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px'
    }).setDOMContent(popupContent);

    // Create marker
    markerRef.current = new maplibregl.Marker({ 
      element: markerEl,
      anchor: 'bottom'
    })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .setPopup(popup)
      .addTo(map);

    // Auto-open popup after a short delay
    setTimeout(() => {
      popup.addTo(map);
    }, 500);

    // Add pulse animation
    const pulseAnimation = document.createElement('div');
    pulseAnimation.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(22, 163, 74, 0.3);
      animation: pulse 2s infinite;
      pointer-events: none;
    `;
    markerEl.appendChild(pulseAnimation);

    // Add animation keyframes
    if (!document.getElementById('pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pulse-keyframes';
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{
          longitude: pickupLocation.lng,
          latitude: pickupLocation.lat,
          zoom: 15,
        }}
        className="w-full h-full rounded-xl"
        onMapLoad={handleMapLoad}
      />
      
      {/* Info Card */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 z-10 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 mb-1">
              Local de Recolha
            </h3>
            <p className="text-xs text-gray-600 mb-1">
              {pickupLocation.clientName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {pickupLocation.address}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          onClick={() => {
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${pickupLocation.lat},${pickupLocation.lng}`,
              '_blank'
            );
          }}
        >
          <Navigation className="w-5 h-5 mr-2" />
          Navegar
        </Button>
      </div>
    </div>
  );
}