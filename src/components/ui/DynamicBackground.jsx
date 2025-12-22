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

  // If not logged in, show subtle nature meadow background
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base gradient - soft natural greens and warm earth tones */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50/80 to-amber-50/40" />
        
        {/* Subtle grass texture pattern - very light */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 8c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5S5 11 5 8zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5zM5 35c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5S5 38 5 35zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5zm12 0c0-3 1.5-7 2.5-7s2.5 4 2.5 7-1 5-2.5 5-2.5-2-2.5-5z' fill='%2322c55e' fill-opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Soft floating orbs - like morning sunlight on grass */}
        <div className="absolute top-[5%] left-[10%] w-[40vw] h-[40vw] bg-green-200/25 rounded-full blur-[100px] animate-blob-1" />
        <div className="absolute top-[50%] right-[5%] w-[35vw] h-[35vw] bg-emerald-100/20 rounded-full blur-[80px] animate-blob-2" />
        <div className="absolute bottom-[10%] left-[30%] w-[30vw] h-[30vw] bg-lime-100/15 rounded-full blur-[90px] animate-blob" />
        
        {/* Warm sunlight from top - like sun through trees */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 via-transparent to-transparent" />
        
        {/* Bottom fade for content readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/30 to-transparent" />
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