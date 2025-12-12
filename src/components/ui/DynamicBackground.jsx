import React from "react";

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Wrapper que roda lentamente tudo (Efeito Galáxia) */}
      <div className="absolute inset-[-30%] animate-spin-slow opacity-60">
        
        {/* Orb 1: Primária */}
        <div 
          className="absolute top-[20%] left-[15%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] animate-blob-1"
          style={{ backgroundColor: 'var(--color-orb-1, #fb923c)' }}
        />

        {/* Orb 2: Secundária */}
        <div 
          className="absolute bottom-[15%] right-[20%] w-[65vw] h-[65vw] rounded-full mix-blend-multiply filter blur-[100px] animate-blob-2"
          style={{ backgroundColor: 'var(--color-orb-2, #fdba74)' }}
        />

        {/* Orb 3: Terciária */}
        <div 
          className="absolute top-[40%] right-[30%] w-[55vw] h-[55vw] rounded-full mix-blend-multiply filter blur-[100px] animate-blob-3"
          style={{ backgroundColor: 'var(--color-primary, #f97316)' }}
        />

      </div>
      
      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
    </div>
  );
}