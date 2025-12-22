import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Raindrop component
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

// Sun rays component
const SunRays = () => (
  <div className="absolute top-0 right-0 w-[60vw] h-[60vw] overflow-hidden">
    <div 
      className="absolute -top-[20%] -right-[20%] w-full h-full rounded-full animate-pulse"
      style={{
        background: 'radial-gradient(circle, rgba(255,236,179,0.4) 0%, rgba(255,193,7,0.2) 30%, transparent 70%)',
        animationDuration: '4s'
      }}
    />
    {/* Sun rays */}
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
  const [weather, setWeather] = useState('sunny'); // sunny, rainy, cloudy
  const [raindrops, setRaindrops] = useState([]);

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

  // Fetch weather based on user location
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Try to get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // Use Open-Meteo API (free, no key needed)
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
              );
              const data = await response.json();
              
              if (data.current_weather) {
                const weatherCode = data.current_weather.weathercode;
                // Weather codes: 0-3 = clear/cloudy, 51-67 = rain, 71-77 = snow, 80-82 = showers
                if ([51, 53, 55, 61, 63, 65, 67, 80, 81, 82].includes(weatherCode)) {
                  setWeather('rainy');
                } else if ([0, 1].includes(weatherCode)) {
                  setWeather('sunny');
                } else {
                  setWeather('cloudy');
                }
              }
            },
            () => {
              // If location denied, default to sunny
              setWeather('sunny');
            },
            { timeout: 5000 }
          );
        }
      } catch (error) {
        console.log('Weather fetch error:', error);
        setWeather('sunny');
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate raindrops when raining
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

  // If not logged in, show park grass background with weather
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* CSS for rain animation */}
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
        
        {/* Dark grass/park texture background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80)',
          }}
        />
        
        {/* Dark green grass overlay */}
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
        
        {/* Weather effects */}
        {weather === 'sunny' && <SunRays />}
        
        {weather === 'rainy' && (
          <>
            {/* Rain overlay darkness */}
            <div className="absolute inset-0 bg-slate-900/20" />
            {/* Raindrops */}
            <div className="absolute inset-0">
              {raindrops.map((drop) => (
                <Raindrop key={drop.id} delay={drop.delay} left={drop.left} />
              ))}
            </div>
          </>
        )}
        
        {/* Soft gradient glow spots - grass tones */}
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
        
        {/* Subtle grass blade pattern */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 2 Q22 12 20 22 Q18 12 20 2' fill='%231b5e20'/%3E%3Cpath d='M8 5 Q10 13 8 23 Q6 13 8 5' fill='%231b5e20'/%3E%3Cpath d='M32 4 Q34 12 32 22 Q30 12 32 4' fill='%231b5e20'/%3E%3Cpath d='M14 20 Q16 28 14 38 Q12 28 14 20' fill='%231b5e20'/%3E%3Cpath d='M26 18 Q28 26 26 36 Q24 26 26 18' fill='%231b5e20'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Vignette for depth */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(27,94,32,0.15) 100%)'
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