import React from "react";

export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Orb 1: Cor dinâmica baseada no tier do usuário */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: 'var(--color-orb-1, #fb923c)' }} 
      />

      {/* Orb 2 */}
      <div 
        className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: 'var(--color-orb-2, #fdba74)' }}
      />
      
      {/* Orb 3 (Fundo) */}
      <div 
        className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: 'var(--color-orb-1, #fb923c)' }}
      />
      
      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/30" />
    </div>
  );
}