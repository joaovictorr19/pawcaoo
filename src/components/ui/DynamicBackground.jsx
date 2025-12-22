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

  // If not logged in, show real nature leaves background
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Real nature photo background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&q=80)',
          }}
        />
        
        {/* Soft green overlay for brand consistency */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2e7d32]/30 via-[#4caf50]/20 to-[#81c784]/30" />
        
        {/* Animated light spots (sun rays through leaves) */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-[5%] left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-soft-light filter blur-[100px] opacity-40 animate-blob-1"
            style={{ backgroundColor: '#c8e6c9' }}
          />
          <div 
            className="absolute bottom-[15%] right-[10%] w-[45vw] h-[45vw] rounded-full mix-blend-soft-light filter blur-[80px] opacity-35 animate-blob-2"
            style={{ backgroundColor: '#a5d6a7' }}
          />
        </div>
        
        {/* Premium vignette for depth */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)'
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