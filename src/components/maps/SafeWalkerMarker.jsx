import React, { memo } from 'react';
import { Marker } from "@/components/ui/map.jsx";

// O memo impede o marcador de re-renderizar se a imagem for a mesma e a posição não mudar significativamente
export const SafeWalkerMarker = memo(({ walker, onClick, children }) => {
  const avatarUrl = walker.photo_url || walker.profile_photo_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100";

  return (
    <Marker 
      longitude={Number(walker.longitude)} 
      latitude={Number(walker.latitude)}
    >
      <div 
        className="relative p-1 bg-slate-900 rounded-full border-2 shadow-lg cursor-pointer transition-transform hover:scale-110"
        style={{ borderColor: walker.has_pawcao_seal || walker.professional_profile?.is_pawcao ? '#f97316' : '#22c55e' }}
        onClick={(e) => { 
          e.stopPropagation(); 
          if (onClick) onClick(walker);
        }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
          <img 
            src={avatarUrl} 
            loading="lazy"
            className="w-full h-full object-cover"
            key={avatarUrl} 
            alt={walker.full_name || walker.walker_name}
          />
        </div>
        {children}
      </div>
    </Marker>
  );
}, (prev, next) => {
  // Só re-renderiza se a posição mudar ou a foto mudar
  return prev.walker.id === next.walker.id && 
         prev.walker.latitude === next.walker.latitude &&
         prev.walker.longitude === next.walker.longitude &&
         prev.walker.photo_url === next.walker.photo_url &&
         prev.walker.has_pawcao_seal === next.walker.has_pawcao_seal;
});