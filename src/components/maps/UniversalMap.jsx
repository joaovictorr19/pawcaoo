import React from 'react';

/**
 * Placeholder UniversalMap - mapa foi removido
 * Use componentes de mapa reais se necessário (maplibre, leaflet, etc.)
 */
export default function UniversalMap({ center, zoom, showControls, children, onMapClick }) {
  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden">
      <div className="text-center text-gray-600">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm">Visualização do mapa desativada</p>
      </div>
    </div>
  );
}