import React from "react";

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a0a1a]">
      {/* Wrapper que roda lentamente tudo (Efeito Galáxia) */}
      <div className="absolute inset-[-50%] animate-spin-slow opacity-70">
        
        {/* Orb 1: Primária (ex: Azul Profundo) */}
        <div 
          className="absolute top-1/4 left-1/4 w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[120px] animate-blob-1"
          style={{ backgroundColor: 'var(--color-orb-1, #1e40af)' }}
        />

        {/* Orb 2: Secundária (ex: Ciano Vibrante) */}
        <div 
          className="absolute bottom-1/4 right-1/4 w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[120px] animate-blob-2"
          style={{ backgroundColor: 'var(--color-orb-2, #06b6d4)' }}
        />

        {/* Orb 3: Terciária (ex: Roxo Elétrico) */}
        <div 
          className="absolute bottom-[-10%] left-[30%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[120px] animate-blob-3"
          style={{ backgroundColor: 'var(--color-primary, #7c3aed)' }}
        />

      </div>
      
      {/* Camada de Ruído (Noise) para textura premium */}
      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}