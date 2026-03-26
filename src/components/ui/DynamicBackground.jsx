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

  // If not logged in, show sky/cloud background
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Sky gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 40%, #e0f2fe 70%, #f0f9ff 100%)'
          }}
        />

        {/* Sun */}
        <div
          className="absolute top-[8%] right-[12%] w-24 h-24 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fef9c3 0%, #fde68a 40%, rgba(253,230,138,0) 75%)',
            filter: 'blur(4px)'
          }}
        />

        {/* Clouds */}
        <div className="absolute top-[12%] left-[8%] opacity-90" style={{ filter: 'blur(2px)' }}>
          <div className="relative">
            <div className="absolute w-32 h-12 bg-white rounded-full" style={{ top: 8, left: 0 }} />
            <div className="absolute w-20 h-16 bg-white rounded-full" style={{ top: 0, left: 20 }} />
            <div className="absolute w-24 h-12 bg-white rounded-full" style={{ top: 6, left: 36 }} />
          </div>
        </div>

        <div className="absolute top-[8%] left-[45%] opacity-80" style={{ filter: 'blur(1px)' }}>
          <div className="relative">
            <div className="absolute w-40 h-14 bg-white rounded-full" style={{ top: 10, left: 0 }} />
            <div className="absolute w-24 h-18 bg-white rounded-full" style={{ top: 0, left: 24 }} />
            <div className="absolute w-28 h-12 bg-white/90 rounded-full" style={{ top: 8, left: 48 }} />
          </div>
        </div>

        <div className="absolute top-[22%] right-[6%] opacity-75" style={{ filter: 'blur(2px)' }}>
          <div className="relative">
            <div className="absolute w-28 h-10 bg-white rounded-full" style={{ top: 8, left: 0 }} />
            <div className="absolute w-16 h-14 bg-white rounded-full" style={{ top: 0, left: 16 }} />
            <div className="absolute w-20 h-10 bg-white rounded-full" style={{ top: 6, left: 28 }} />
          </div>
        </div>

        <div className="absolute top-[32%] left-[20%] opacity-60" style={{ filter: 'blur(3px)' }}>
          <div className="relative">
            <div className="absolute w-36 h-10 bg-white/80 rounded-full" style={{ top: 6, left: 0 }} />
            <div className="absolute w-20 h-14 bg-white/80 rounded-full" style={{ top: 0, left: 20 }} />
            <div className="absolute w-24 h-10 bg-white/70 rounded-full" style={{ top: 5, left: 40 }} />
          </div>
        </div>

        {/* Subtle bottom haze */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{ background: 'linear-gradient(to top, rgba(224,242,254,0.6) 0%, transparent 100%)' }}
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