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

  // If not logged in, show premium nature background
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base nature gradient - soft greens */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5e9] via-[#c8e6c9] to-[#a5d6a7]" />
        
        {/* Organic leaf/nature texture pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Leaf shapes */}
              <path d="M20,50 Q30,30 50,50 Q30,70 20,50" fill="#2e7d32" transform="rotate(15 35 50)"/>
              <path d="M60,20 Q70,5 85,20 Q70,35 60,20" fill="#388e3c" transform="rotate(-20 72 20)"/>
              <path d="M70,70 Q80,55 95,70 Q80,85 70,70" fill="#43a047" transform="rotate(30 82 70)"/>
              <path d="M5,80 Q15,65 30,80 Q15,95 5,80" fill="#4caf50" transform="rotate(-10 17 80)"/>
              {/* Small dots like dewdrops */}
              <circle cx="45" cy="45" r="2" fill="#81c784" opacity="0.6"/>
              <circle cx="78" cy="42" r="1.5" fill="#a5d6a7" opacity="0.5"/>
              <circle cx="25" cy="15" r="1.8" fill="#66bb6a" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)"/>
        </svg>
        
        {/* Organic flowing shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="organic" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M0,100 Q50,50 100,100 T200,100" stroke="#1b5e20" strokeWidth="1" fill="none"/>
              <path d="M0,150 Q50,100 100,150 T200,150" stroke="#2e7d32" strokeWidth="0.8" fill="none"/>
              <path d="M0,50 Q50,0 100,50 T200,50" stroke="#388e3c" strokeWidth="0.6" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#organic)"/>
        </svg>
        
        {/* Animated nature orbs (soft light through trees) */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-[5%] left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-soft-light filter blur-[120px] opacity-60 animate-blob-1"
            style={{ backgroundColor: '#c8e6c9' }}
          />
          <div 
            className="absolute bottom-[10%] right-[5%] w-[60vw] h-[60vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-50 animate-blob-2"
            style={{ backgroundColor: '#a5d6a7' }}
          />
          <div 
            className="absolute top-[40%] right-[30%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[90px] opacity-40 animate-blob-3"
            style={{ backgroundColor: '#81c784' }}
          />
        </div>
        
        {/* Soft light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#388e3c]/10 via-transparent to-white/30" />
        
        {/* Premium vignette */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(27,94,32,0.08) 100%)'
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