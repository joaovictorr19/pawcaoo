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
        
        {/* Dog toys scattered on grass */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Tennis balls */}
          <div className="absolute top-[15%] left-[8%] w-8 h-8 rounded-full opacity-40 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #c0ca33, #9e9d24)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3)'
            }}
          >
            <div className="absolute inset-[25%] rounded-full border-2 border-white/40" style={{ borderStyle: 'dashed' }} />
          </div>
          
          <div className="absolute top-[45%] right-[12%] w-6 h-6 rounded-full opacity-35 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #c0ca33, #9e9d24)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div className="absolute inset-[25%] rounded-full border border-white/30" style={{ borderStyle: 'dashed' }} />
          </div>
          
          <div className="absolute bottom-[25%] left-[25%] w-5 h-5 rounded-full opacity-30 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ef5350, #c62828)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)'
            }}
          />
          
          <div className="absolute top-[70%] right-[30%] w-7 h-7 rounded-full opacity-35 shadow-lg"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #42a5f5, #1565c0)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)'
            }}
          />
          
          {/* Dog bones */}
          <svg className="absolute top-[20%] right-[20%] w-12 h-6 opacity-40" viewBox="0 0 48 24" style={{ transform: 'rotate(-15deg)' }}>
            <ellipse cx="6" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="6" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <rect x="6" y="8" width="36" height="8" fill="#f5f5dc" />
            <ellipse cx="6" cy="6" rx="5" ry="4" fill="#fafad2" />
            <ellipse cx="42" cy="6" rx="5" ry="4" fill="#fafad2" />
          </svg>
          
          <svg className="absolute bottom-[35%] left-[15%] w-10 h-5 opacity-35" viewBox="0 0 48 24" style={{ transform: 'rotate(25deg)' }}>
            <ellipse cx="6" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="6" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <rect x="6" y="8" width="36" height="8" fill="#f5f5dc" />
          </svg>
          
          <svg className="absolute top-[55%] left-[60%] w-8 h-4 opacity-30" viewBox="0 0 48 24" style={{ transform: 'rotate(-45deg)' }}>
            <ellipse cx="6" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="6" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="6" rx="6" ry="5" fill="#f5f5dc" />
            <ellipse cx="42" cy="18" rx="6" ry="5" fill="#f5f5dc" />
            <rect x="6" y="8" width="36" height="8" fill="#f5f5dc" />
          </svg>
          
          <svg className="absolute bottom-[15%] right-[8%] w-14 h-7 opacity-40" viewBox="0 0 48 24" style={{ transform: 'rotate(10deg)' }}>
            <ellipse cx="6" cy="6" rx="6" ry="5" fill="#ffe4b5" />
            <ellipse cx="6" cy="18" rx="6" ry="5" fill="#ffe4b5" />
            <ellipse cx="42" cy="6" rx="6" ry="5" fill="#ffe4b5" />
            <ellipse cx="42" cy="18" rx="6" ry="5" fill="#ffe4b5" />
            <rect x="6" y="8" width="36" height="8" fill="#ffe4b5" />
          </svg>
          
          {/* Extra small balls scattered */}
          <div className="absolute top-[35%] left-[45%] w-4 h-4 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle at 30% 30%, #ff9800, #e65100)' }}
          />
          <div className="absolute bottom-[45%] right-[45%] w-3 h-3 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, #9c27b0, #6a1b9a)' }}
          />
          <div className="absolute top-[80%] left-[70%] w-5 h-5 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle at 30% 30%, #c0ca33, #9e9d24)' }}
          >
            <div className="absolute inset-[25%] rounded-full border border-white/30" style={{ borderStyle: 'dashed' }} />
          </div>
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
          className="absolute top-[5%] left-[10%] w-[50vw] h-[50vw] rounded-full filter blur-[120px] opacity-20 animate-blob-1"
          style={{ backgroundColor: orbColors.primary, transition: 'background-color 1s ease' }}
        />

        {/* Orb 2: Secondary accent */}
        <div 
          className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] rounded-full filter blur-[120px] opacity-15 animate-blob-2"
          style={{ backgroundColor: orbColors.secondary, transition: 'background-color 1s ease' }}
        />

        {/* Orb 3: Tertiary depth */}
        <div 
          className="absolute top-[50%] left-[50%] w-[40vw] h-[40vw] rounded-full filter blur-[100px] opacity-10 animate-blob-3"
          style={{ backgroundColor: orbColors.tertiary, transition: 'background-color 1s ease' }}
        />

      </div>
    </div>
  );
}