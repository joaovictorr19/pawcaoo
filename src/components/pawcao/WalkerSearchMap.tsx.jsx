import React from 'react';
import { Map } from '@/components/ui/map';

interface WalkerSearchMapProps {
  walkers?: any[];
  userLocation?: { lat: number; lng: number } | null;
  onWalkerClick?: (walker: any) => void;
}

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }: WalkerSearchMapProps) {
  return (
    <Map
      initialViewState={{
        longitude: userLocation?.lng || -9.1393,
        latitude: userLocation?.lat || 38.7223,
        zoom: 12,
      }}
      className="w-full h-full"
    >
      {/* Markers will be added here in the next step */}
    </Map>
  );
}