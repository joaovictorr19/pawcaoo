import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Compass, Locate, Minus, Plus } from 'lucide-react';

export default function MapControls({ 
  position = 'top-right',
  showZoom = true,
  showCompass = true,
  showLocate = true,
  onLocate
}) {
  const [heading, setHeading] = useState(0);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (onLocate) {
          onLocate(coords);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location');
      }
    );
  };

  // Listen to device orientation for compass
  useEffect(() => {
    if (!showCompass) return;

    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        setHeading(event.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [showCompass]);

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col gap-2 z-10`}>
      {showZoom && (
        <div className="flex flex-col gap-1 bg-white rounded-lg shadow-lg p-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              // Map zoom in logic will be handled by parent
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              // Map zoom out logic will be handled by parent
            }}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {showCompass && (
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 bg-white shadow-lg"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <Compass className="w-5 h-5 text-gray-700" />
        </Button>
      )}

      {showLocate && (
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 bg-white shadow-lg hover:bg-blue-50"
          onClick={handleLocate}
          title="Find my location"
        >
          <Locate className="w-5 h-5 text-blue-600" />
        </Button>
      )}
    </div>
  );
}