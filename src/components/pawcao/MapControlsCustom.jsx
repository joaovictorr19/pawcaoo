import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Navigation, Compass } from 'lucide-react';

export function MapControlsCustom({ mapRef }) {
  const handleZoomIn = () => {
    if (mapRef?.current) {
      mapRef.current.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (mapRef?.current) {
      mapRef.current.zoomOut({ duration: 300 });
    }
  };

  const handleLocate = () => {
    if (!mapRef?.current || !navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: 1000
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleResetBearing = () => {
    if (mapRef?.current) {
      mapRef.current.easeTo({ bearing: 0, pitch: 0, duration: 500 });
    }
  };

  return (
    <div className="absolute right-2 top-2 flex flex-col gap-1">
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomIn}
        className="h-8 w-8 bg-white hover:bg-gray-100 shadow-md"
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomOut}
        className="h-8 w-8 bg-white hover:bg-gray-100 shadow-md"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleLocate}
        className="h-8 w-8 bg-white hover:bg-gray-100 shadow-md"
      >
        <Navigation className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleResetBearing}
        className="h-8 w-8 bg-white hover:bg-gray-100 shadow-md"
      >
        <Compass className="w-4 h-4" />
      </Button>
    </div>
  );
}