import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "../ThemeContext";

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

// Snowflake component
const Snowflake = ({ delay, left, size }) => (
  <div
    className="absolute bg-white rounded-full animate-snow"
    style={{
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: `${0.4 + Math.random() * 0.6}`,
      animationDelay: `${delay}s`,
      animationDuration: `${5 + Math.random() * 5}s`,
      filter: 'blur(0.5px)'
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
  const [weather, setWeather] = useState('sunny'); // sunny, rainy, cloudy, snowy
  const [raindrops, setRaindrops] = useState([]);
  const [snowflakes, setSnowflakes] = useState([]);

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
                } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) { // Snow codes
                  setWeather('snowy');
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

  // Generate snowflakes when snowing
  useEffect(() => {
    if (weather === 'snowy') {
      const flakes = [...Array(40)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        size: 3 + Math.random() * 4
      }));
      setSnowflakes(flakes);
    } else {
      setSnowflakes([]);
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
          @keyframes snow {
            0% { transform: translateY(-10vh) translateX(-10px); opacity: 0; }
            10% { opacity: 0.8; }
            100% { transform: translateY(110vh) translateX(20px); opacity: 0.3; }
          }
          .animate-rain {
            animation: rain linear infinite;
          }
          .animate-snow {
            animation: snow linear infinite;
          }
        `}</style>
        
        {/* Realistic Forest Path background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: weather === 'snowy' 
              ? 'url(https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=1920&q=80)' // Snowy forest path
              : 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80)', // Green forest path with light
          }}
        />
        
        {/* Subtle Overlay for readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: weather === 'rainy' 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,20,10,0.6))' 
              : weather === 'snowy'
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(10,20,30,0.4))'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,20,5,0.5))' 
          }}
        />
        
        {/* Weather effects */}
        {weather === 'sunny' && <SunRays />}
        
        {weather === 'rainy' && (
          <>
            <div className="absolute inset-0 bg-slate-900/30" />
            <div className="absolute inset-0">
              {raindrops.map((drop) => (
                <Raindrop key={drop.id} delay={drop.delay} left={drop.left} />
              ))}
            </div>
          </>
        )}

        {weather === 'snowy' && (
          <>
            <div className="absolute inset-0 bg-white/5" />
            <div className="absolute inset-0">
              {snowflakes.map((flake) => (
                <Snowflake key={flake.id} delay={flake.delay} left={flake.left} size={flake.size} />
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
        
        {/* Realistic grass texture pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grass1' x1='0%25' y1='100%25' x2='0%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%231b5e20'/%3E%3Cstop offset='100%25' stop-color='%232e7d32'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M5 100 Q6 85 5 70 Q4 85 5 100' fill='url(%23grass1)'/%3E%3Cpath d='M8 100 Q10 80 8 60 Q6 80 8 100' fill='%23388e3c'/%3E%3Cpath d='M12 100 Q13 88 12 75 Q11 88 12 100' fill='%231b5e20'/%3E%3Cpath d='M18 100 Q20 78 18 55 Q16 78 18 100' fill='%232e7d32'/%3E%3Cpath d='M22 100 Q23 85 22 70 Q21 85 22 100' fill='%23388e3c'/%3E%3Cpath d='M28 100 Q30 75 28 50 Q26 75 28 100' fill='%231b5e20'/%3E%3Cpath d='M32 100 Q33 90 32 80 Q31 90 32 100' fill='%232e7d32'/%3E%3Cpath d='M38 100 Q40 82 38 65 Q36 82 38 100' fill='%23388e3c'/%3E%3Cpath d='M42 100 Q43 88 42 75 Q41 88 42 100' fill='%231b5e20'/%3E%3Cpath d='M48 100 Q50 76 48 52 Q46 76 48 100' fill='%232e7d32'/%3E%3Cpath d='M52 100 Q53 85 52 70 Q51 85 52 100' fill='%23388e3c'/%3E%3Cpath d='M58 100 Q60 80 58 60 Q56 80 58 100' fill='%231b5e20'/%3E%3Cpath d='M62 100 Q63 92 62 83 Q61 92 62 100' fill='%232e7d32'/%3E%3Cpath d='M68 100 Q70 78 68 55 Q66 78 68 100' fill='%23388e3c'/%3E%3Cpath d='M72 100 Q73 86 72 72 Q71 86 72 100' fill='%231b5e20'/%3E%3Cpath d='M78 100 Q80 74 78 48 Q76 74 78 100' fill='%232e7d32'/%3E%3Cpath d='M82 100 Q83 88 82 76 Q81 88 82 100' fill='%23388e3c'/%3E%3Cpath d='M88 100 Q90 82 88 64 Q86 82 88 100' fill='%231b5e20'/%3E%3Cpath d='M92 100 Q93 90 92 80 Q91 90 92 100' fill='%232e7d32'/%3E%3Cpath d='M98 100 Q100 84 98 68 Q96 84 98 100' fill='%23388e3c'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Second grass layer for depth */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 60 Q5 45 3 30 Q1 45 3 60' fill='%234caf50'/%3E%3Cpath d='M15 60 Q17 50 15 40 Q13 50 15 60' fill='%2366bb6a'/%3E%3Cpath d='M27 60 Q29 42 27 25 Q25 42 27 60' fill='%234caf50'/%3E%3Cpath d='M39 60 Q41 48 39 36 Q37 48 39 60' fill='%2366bb6a'/%3E%3Cpath d='M51 60 Q53 44 51 28 Q49 44 51 60' fill='%234caf50'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            transform: 'translateX(20px)'
          }}
        />
        
        {/* Forest Elements: Trails, Trees, Birds */}
        <div className="absolute inset-0 overflow-hidden">
          
          {/* Forest Trails - Organic paths */}
          <div className="absolute top-[20%] left-0 right-0 h-32 opacity-20"
            style={{
              background: 'linear-gradient(170deg, transparent 0%, rgba(93, 64, 55, 0.4) 40%, rgba(93, 64, 55, 0.3) 60%, transparent 100%)',
              transform: 'skewY(-3deg) scale(1.1)'
            }}
          />
          
          <div className="absolute bottom-[20%] left-0 right-0 h-24 opacity-15"
            style={{
              background: 'linear-gradient(10deg, transparent 0%, rgba(62, 39, 35, 0.5) 45%, rgba(93, 64, 55, 0.4) 55%, transparent 100%)',
              transform: 'skewY(2deg) scale(1.2)'
            }}
          />

          {/* Birds in distance */}
          <svg className="absolute top-[15%] left-[25%] w-8 h-4 opacity-40 animate-pulse" viewBox="0 0 24 12" style={{ animationDuration: '4s' }}>
             <path d="M1,6 Q6,1 12,6 T23,6" fill="none" stroke="#1a2e1a" strokeWidth="2" />
          </svg>
          <svg className="absolute top-[12%] left-[22%] w-6 h-3 opacity-30 animate-pulse" viewBox="0 0 24 12" style={{ animationDuration: '5s' }}>
             <path d="M1,6 Q6,1 12,6 T23,6" fill="none" stroke="#1a2e1a" strokeWidth="2" />
          </svg>

          {/* Deer Silhouette (Subtle) */}
          <svg className="absolute bottom-[18%] right-[15%] w-16 h-20 opacity-20" viewBox="0 0 100 100">
             <path d="M50,80 L50,60 L60,50 L70,60 L70,80 M60,50 L60,30 L55,20 M65,20 L60,30" fill="none" stroke="#3e2723" strokeWidth="2" />
             <circle cx="55" cy="20" r="1" fill="#3e2723" />
          </svg>

          {/* Majestic Forest Trees */}
          <svg className="absolute top-[10%] left-[5%] w-24 h-32 opacity-30" viewBox="0 0 60 80">
            <rect x="26" y="50" width="8" height="30" fill="#3e2723" />
            <path d="M30 10 L10 50 L50 50 Z" fill="#1b5e20" />
            <path d="M30 25 L15 50 L45 50 Z" fill="#2e7d32" />
          </svg>

          <svg className="absolute bottom-[20%] left-[8%] w-32 h-40 opacity-25" viewBox="0 0 60 80">
            <rect x="26" y="60" width="8" height="20" fill="#3e2723" />
            <path d="M30 15 L5 60 L55 60 Z" fill="#1b5e20" />
            <path d="M30 30 L10 60 L50 60 Z" fill="#2e7d32" />
          </svg>

          <svg className="absolute top-[30%] right-[5%] w-20 h-28 opacity-30" viewBox="0 0 60 80">
            <rect x="26" y="50" width="8" height="30" fill="#3e2723" />
            <path d="M30 10 L10 50 L50 50 Z" fill="#1b5e20" />
            <path d="M30 25 L15 50 L45 50 Z" fill="#2e7d32" />
          </svg>
          
          <svg className="absolute bottom-[40%] right-[12%] w-16 h-24 opacity-20" viewBox="0 0 60 80">
            <rect x="26" y="50" width="8" height="30" fill="#3e2723" />
            <path d="M30 10 L10 50 L50 50 Z" fill="#1b5e20" />
          </svg>

        </div>
        
        {/* Vignette for depth */}
        <div className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(27,94,32,0.15) 100%)'
          }}
        />
      </div>
    );
  }

  const { colors, level } = useTheme();
  
  const getOrbColorsByTheme = (themeName) => {
    const themeMap = {
      'forest': { primary: '#059669', secondary: '#10b981', tertiary: '#34d399' },
      'navy': { primary: '#1e3a8a', secondary: '#3b82f6', tertiary: '#60a5fa' },
      'wine': { primary: '#9f1239', secondary: '#e11d48', tertiary: '#fb7185' },
      'amber': { primary: '#d97706', secondary: '#f59e0b', tertiary: '#fbbf24' },
      'gold': { primary: '#eab308', secondary: '#facc15', tertiary: '#fde047' }
    };
    return themeMap[themeName] || themeMap['forest'];
  };

  const orbColors = getOrbColorsByTheme(colors?.name || 'forest');

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gray-50 w-screen h-screen" style={{ minHeight: '100vh', minWidth: '100vw' }}>
      {/* Dynamic animated orbs based on user level */}
      <div className="absolute inset-0">
        
        {/* Orb 1: Primary tier color */}
        <div 
          className="absolute top-[5%] left-[10%] w-[50vw] h-[50vw] rounded-full filter blur-[120px] opacity-30 animate-blob-1"
          style={{ backgroundColor: orbColors.primary, transition: 'background-color 1s ease' }}
        />

        {/* Orb 2: Secondary accent */}
        <div 
          className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] rounded-full filter blur-[120px] opacity-25 animate-blob-2"
          style={{ backgroundColor: orbColors.secondary, transition: 'background-color 1s ease' }}
        />

        {/* Orb 3: Tertiary depth */}
        <div 
          className="absolute top-[50%] left-[50%] w-[40vw] h-[40vw] rounded-full filter blur-[100px] opacity-18 animate-blob-3"
          style={{ backgroundColor: orbColors.tertiary, transition: 'background-color 1s ease' }}
        />

      </div>
    </div>
  );
}