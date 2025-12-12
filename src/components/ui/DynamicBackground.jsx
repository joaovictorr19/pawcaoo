import React from "react";

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Wrapper que roda lentamente tudo (Efeito Galáxia) */}
      <div className="absolute inset-0 animate-spin-slow opacity-60">
        
        {/* Orb 1: TOP-LEFT - COR PRINCIPAL */}
        <div 
          className="absolute top-[25%] left-[25%] w-[80vw] h-[80vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-blob-1"
          style={{ backgroundColor: 'var(--color-orb-1, #fb923c)', transition: 'background-color 1s ease' }}
        />

        {/* Orb 2: BOTTOM-RIGHT - COR SECUNDÁRIA */}
        <div 
          className="absolute bottom-[25%] right-[25%] w-[80vw] h-[80vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-80 animate-blob-2"
          style={{ backgroundColor: 'var(--color-orb-2, #fdba74)', transition: 'background-color 1s ease' }}
        />

        {/* Orb 3: CENTRO-LEFT - COR DE PROFUNDIDADE */}
        <div 
          className="absolute top-[33%] left-[33%] w-[80vw] h-[80vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob-3"
          style={{ backgroundColor: 'var(--color-primary, #f97316)', transition: 'background-color 1s ease' }}
        />

      </div>
      
      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
    </div>
  );
}