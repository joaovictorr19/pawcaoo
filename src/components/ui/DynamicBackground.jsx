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

  // If not logged in, show sage green background with earthy pattern
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#E8F5E9' }}>
        {/* SVG Pattern with earthy tones */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="nature-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Paw prints */}
              <g opacity="0.2" fill="#A1887F">
                <circle cx="30" cy="30" r="8" />
                <circle cx="50" cy="25" r="6" />
                <circle cx="55" cy="40" r="6" />
                <circle cx="35" cy="45" r="6" />
                <ellipse cx="42" cy="35" rx="10" ry="12" />
              </g>
              
              {/* Leaves */}
              <g opacity="0.2" stroke="#A1887F" strokeWidth="1.5" fill="none">
                <path d="M 120 80 Q 130 60, 140 80 Q 130 90, 120 80" />
                <path d="M 130 80 L 130 100" />
                <path d="M 160 120 Q 170 100, 180 120 Q 170 130, 160 120" />
                <path d="M 170 120 L 170 140" />
              </g>
              
              {/* More paw prints scattered */}
              <g opacity="0.15" fill="#A1887F">
                <circle cx="150" cy="50" r="7" />
                <circle cx="165" cy="47" r="5" />
                <circle cx="169" cy="58" r="5" />
                <circle cx="153" cy="62" r="5" />
                <ellipse cx="159" cy="54" rx="9" ry="11" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nature-pattern)" />
        </svg>
        
        {/* Subtle animated light spots */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-[5%] left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-20 animate-blob-1"
            style={{ backgroundColor: '#A1887F' }}
          />
          <div 
            className="absolute bottom-[15%] right-[10%] w-[45vw] h-[45vw] rounded-full mix-blend-soft-light filter blur-[80px] opacity-15 animate-blob-2"
            style={{ backgroundColor: '#C8B8A8' }}
          />
        </div>
        
        {/* Soft vignette for depth */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)'
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