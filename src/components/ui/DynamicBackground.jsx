import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DynamicBackground() {
  // Check if user is logged in
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const isLoggedIn = !!user;

  // If not logged in, show premium grass field background
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base grass gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7cb342] via-[#8bc34a] to-[#9ccc65]" />
        
        {/* Grass texture pattern overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.1) 2px,
                rgba(255,255,255,0.1) 4px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(0,100,0,0.15) 8px,
                rgba(0,100,0,0.15) 16px
              )
            `,
            backgroundSize: '4px 16px'
          }}
        />
        
        {/* Grass blades effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(135deg, rgba(100,180,50,0.4) 25%, transparent 25%),
              linear-gradient(225deg, rgba(100,180,50,0.4) 25%, transparent 25%),
              linear-gradient(45deg, rgba(100,180,50,0.4) 25%, transparent 25%),
              linear-gradient(315deg, rgba(100,180,50,0.4) 25%, transparent 25%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 0, 10px -10px, 0px 10px'
          }}
        />
        
        {/* Animated light spots (sun rays on grass) */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-[5%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-50 animate-blob-1"
            style={{ backgroundColor: '#c5e1a5' }}
          />
          <div 
            className="absolute bottom-[20%] right-[15%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[80px] opacity-40 animate-blob-2"
            style={{ backgroundColor: '#dce775' }}
          />
          <div 
            className="absolute top-[50%] left-[10%] w-[40vw] h-[40vw] rounded-full mix-blend-soft-light filter blur-[90px] opacity-35 animate-blob-3"
            style={{ backgroundColor: '#aed581' }}
          />
        </div>
        
        {/* Premium gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#558b2f]/30 via-transparent to-white/20" />
        
        {/* Subtle vignette for premium feel */}
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(46,125,50,0.15) 100%)'
          }}
        />
      </div>
    );
  }

  // Logged in users: dynamic tier-based background
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-900">
      {/* Wrapper que roda lentamente tudo (Efeito Galáxia) */}
      <div className="absolute inset-0 animate-spin-slow">
        
        {/* Orb 1: COR MAIS CLARA (Brilho) - Use ORB-2 */}
        <div 
          className="absolute top-[10%] left-[15%] w-[90vw] h-[90vw] rounded-full mix-blend-multiply filter blur-[140px] opacity-70 animate-blob-1"
          style={{ backgroundColor: 'var(--color-orb-2, #fdba74)', transition: 'background-color 1s ease' }}
        />

        {/* Orb 2: COR BASE DA TIER - Use ORB-1 */}
        <div 
          className="absolute bottom-[15%] right-[10%] w-[85vw] h-[85vw] rounded-full mix-blend-multiply filter blur-[140px] opacity-75 animate-blob-2"
          style={{ backgroundColor: 'var(--color-orb-1, #fb923c)', transition: 'background-color 1s ease' }}
        />

        {/* Orb 3: COR DE PROFUNDIDADE (A mais escura) - Use PRIMARY */}
        <div 
          className="absolute top-[40%] left-[40%] w-[95vw] h-[95vw] rounded-full mix-blend-multiply filter blur-[140px] opacity-65 animate-blob-3"
          style={{ backgroundColor: 'var(--color-primary, #f97316)', transition: 'background-color 1s ease' }}
        />

      </div>
      
      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />
    </div>
  );
}