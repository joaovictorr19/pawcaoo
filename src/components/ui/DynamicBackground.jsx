import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const Raindrop = ({ delay, left }) => (
  <div
    className="absolute w-0.5 h-4 bg-gradient-to-b from-transparent via-blue-300/60 to-blue-400/80 rounded-full animate-rain"
    style={{
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${0.8 + Math.random() * 0.4}s`
    }}
  />
);

const SunRays = () => (
  <div className="absolute top-0 right-0 w-[60vw] h-[60vw] overflow-hidden">
    <div 
      className="absolute -top-[20%] -right-[20%] w-full h-full rounded-full animate-pulse"
      style={{
        background: 'radial-gradient(circle, rgba(255,236,179,0.4) 0%, rgba(255,193,7,0.2) 30%, transparent 70%)',
        animationDuration: '4s'
      }}
    />
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute top-[10%] right-[10%] w-[300px] h-[2px] origin-left opacity-20"
        style={{
          background: 'linear-gradient(90deg, rgba(255,235,59,0.6) 0%, transparent 100%)',
          transform: `rotate(${i * 45}deg)`,
        }}
      />
    ))}
  </div>
);

export default function DynamicBackground() {
  const [weather, setWeather] = useState('sunny');
  const [raindrops, setRaindrops] = useState([]);

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
    staleTime: 60000,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
              );
              const data = await response.json();
              
              if (data.current_weather) {
                const weatherCode = data.current_weather.weathercode;
                if ([51, 53, 55, 61, 63, 65, 67, 80, 81, 82].includes(weatherCode)) {
                  setWeather('rainy');
                } else if ([0, 1].includes(weatherCode)) {
                  setWeather('sunny');
                } else {
                  setWeather('cloudy');
                }
              }
            },
            () => setWeather('sunny'),
            { timeout: 5000 }
          );
        }
      } catch (error) {
        setWeather('sunny');
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (weather === 'rainy') {
      const drops = [...Array(50)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setRaindrops(drops);
    } else {
      setRaindrops([]);
    }
  }, [weather]);

  const isLoggedIn = !!user;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes rain {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
          .animate-rain {
            animation: rain linear infinite;
          }
        `}</style>
        
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80)',
          }}
        />
        
        <div 
          className="absolute inset-0"
          style={{
            background: weather === 'rainy' 
              ? 'linear-gradient(135deg, rgba(27,94,32,0.92) 0%, rgba(46,125,50,0.88) 50%, rgba(56,142,60,0.90) 100%)'
              : weather === 'sunny'
              ? 'linear-gradient(135deg, rgba(46,125,50,0.85) 0%, rgba(56,142,60,0.80) 50%, rgba(76,175,80,0.82) 100%)'
              : 'linear-gradient(135deg, rgba(37,105,42,0.88) 0%, rgba(51,130,55,0.85) 50%, rgba(66,155,70,0.87) 100%)'
          }}
        />
        
        {weather === 'sunny' && <SunRays />}
        
        {weather === 'rainy' && (
          <>
            <div className="absolute inset-0 bg-slate-900/20" />
            <div className="absolute inset-0">
              {raindrops.map((drop) => (
                <Raindrop key={drop.id} delay={drop.delay} left={drop.left} />
              ))}
            </div>
          </>
        )}
        
        <div className="absolute inset-0">
          <div 
            className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full filter blur-[120px] opacity-25"
            style={{ backgroundColor: weather === 'sunny' ? '#7cb342' : '#558b2f' }}
          />
          <div 
            className="absolute bottom-[20%] right-[5%] w-[35vw] h-[35vw] rounded-full filter blur-[100px] opacity-20"
            style={{ backgroundColor: weather === 'sunny' ? '#8bc34a' : '#689f38' }}
          />
        </div>
        
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 100 Q6 85 5 70' fill='%232e7d32'/%3E%3Cpath d='M15 100 Q17 80 15 60' fill='%23388e3c'/%3E%3Cpath d='M25 100 Q27 75 25 50' fill='%231b5e20'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] left-[8%] w-8 h-8 rounded-full opacity-40 shadow-lg"
            style={{ background: 'radial-gradient(circle at 30% 30%, #c0ca33, #9e9d24)' }}>
            <div className="absolute inset-[25%] rounded-full border-2 border-white/40" style={{ borderStyle: 'dashed' }} />
          </div>
          <div className="absolute bottom-[25%] left-[25%] w-5 h-5 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle at 30% 30%, #ef5350, #c62828)' }} />
          <div className="absolute top-[70%] right-[30%] w-7 h-7 rounded-full opacity-35"
            style={{ background: 'radial-gradient(circle at 30% 30%, #42a5f5, #1565c0)' }} />
        </div>
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