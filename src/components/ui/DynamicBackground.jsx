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
        {/* Base nature gradient - rich greens */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4caf50] via-[#66bb6a] to-[#81c784]" />
        
        {/* Realistic leaf pattern layer 1 - large leaves */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="realLeaves1" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Realistic leaf with stem and veins */}
              <g transform="translate(20,20) rotate(25)">
                <path d="M0,25 Q15,-5 30,25 Q15,55 0,25" fill="#2e7d32"/>
                <path d="M15,5 L15,45" stroke="#1b5e20" strokeWidth="0.8" fill="none"/>
                <path d="M15,15 L8,10" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
                <path d="M15,15 L22,10" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
                <path d="M15,25 L6,20" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
                <path d="M15,25 L24,20" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
                <path d="M15,35 L8,32" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
                <path d="M15,35 L22,32" stroke="#1b5e20" strokeWidth="0.4" fill="none"/>
              </g>
              {/* Second leaf */}
              <g transform="translate(70,60) rotate(-15)">
                <path d="M0,20 Q12,-3 24,20 Q12,43 0,20" fill="#388e3c"/>
                <path d="M12,3 L12,37" stroke="#2e7d32" strokeWidth="0.6" fill="none"/>
                <path d="M12,12 L6,8" stroke="#2e7d32" strokeWidth="0.3" fill="none"/>
                <path d="M12,12 L18,8" stroke="#2e7d32" strokeWidth="0.3" fill="none"/>
                <path d="M12,22 L5,18" stroke="#2e7d32" strokeWidth="0.3" fill="none"/>
                <path d="M12,22 L19,18" stroke="#2e7d32" strokeWidth="0.3" fill="none"/>
              </g>
              {/* Small accent leaf */}
              <g transform="translate(90,15) rotate(45)">
                <path d="M0,12 Q8,-2 16,12 Q8,26 0,12" fill="#43a047"/>
                <path d="M8,2 L8,22" stroke="#2e7d32" strokeWidth="0.4" fill="none"/>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#realLeaves1)"/>
        </svg>
        
        {/* Leaf pattern layer 2 - offset for density */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="realLeaves2" x="60" y="60" width="140" height="140" patternUnits="userSpaceOnUse">
              <g transform="translate(30,40) rotate(-35)">
                <path d="M0,28 Q17,-6 34,28 Q17,62 0,28" fill="#1b5e20"/>
                <path d="M17,4 L17,52" stroke="#0d3d12" strokeWidth="0.7" fill="none"/>
                <path d="M17,16 L8,11" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
                <path d="M17,16 L26,11" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
                <path d="M17,28 L7,23" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
                <path d="M17,28 L27,23" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
                <path d="M17,40 L9,36" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
                <path d="M17,40 L25,36" stroke="#0d3d12" strokeWidth="0.35" fill="none"/>
              </g>
              <g transform="translate(100,90) rotate(20)">
                <path d="M0,18 Q11,-4 22,18 Q11,40 0,18" fill="#2e7d32"/>
                <path d="M11,2 L11,34" stroke="#1b5e20" strokeWidth="0.5" fill="none"/>
                <path d="M11,10 L5,6" stroke="#1b5e20" strokeWidth="0.3" fill="none"/>
                <path d="M11,10 L17,6" stroke="#1b5e20" strokeWidth="0.3" fill="none"/>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#realLeaves2)"/>
        </svg>
        
        {/* Animated nature orbs (dappled sunlight through leaves) */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-[5%] left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-soft-light filter blur-[120px] opacity-50 animate-blob-1"
            style={{ backgroundColor: '#a5d6a7' }}
          />
          <div 
            className="absolute bottom-[10%] right-[5%] w-[60vw] h-[60vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-45 animate-blob-2"
            style={{ backgroundColor: '#81c784' }}
          />
          <div 
            className="absolute top-[40%] right-[30%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[90px] opacity-40 animate-blob-3"
            style={{ backgroundColor: '#c8e6c9' }}
          />
        </div>
        
        {/* Soft light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b5e20]/15 via-transparent to-white/20" />
        
        {/* Premium vignette */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(27,94,32,0.12) 100%)'
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