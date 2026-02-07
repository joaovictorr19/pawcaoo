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
  
  // CRITICAL: Always call useTheme BEFORE conditional returns
  const { colors, level } = useTheme();

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

  // If not logged in, show park grass background with weather
  if (!user) {
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
        
        {/* Realistic Animals & Nature Elements (Photo Overlays) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          
          {/* Real Dog Image - Bottom Right - Golden Retriever */}
          <div 
            className="absolute bottom-[-20px] right-[5%] w-[250px] md:w-[350px] h-[300px] opacity-90 z-10"
            style={{
              backgroundImage: 'url(https://purepng.com/public/uploads/large/purepng.com-golden-retriever-dogdoganimalgolden-retriever-9815246727220i2cw.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom right',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
            }}
          />

          {/* Real Dog Image - Bottom Left - Sitting Dog */}
          <div 
            className="absolute bottom-[5%] left-[5%] w-[180px] md:w-[220px] h-[220px] opacity-80 z-0"
            style={{
              backgroundImage: 'url(https://purepng.com/public/uploads/large/purepng.com-dog-sittingdoganimalpet-981524673352ki2w7.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom left',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))'
            }}
          />

          {/* Floating Leaves/Particles for realism */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />

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

  // Theme colors already called at the top (before conditional return)
  
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