import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "../ThemeContext";

export default function DynamicBackground() {
  const [weather, setWeather] = useState('sunny');
  const { colors } = useTheme(); // MUST be before any conditional return

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
                } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
                  setWeather('snowy');
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
      } catch {
        setWeather('sunny');
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getOrbColors = (themeName) => {
    const themeMap = {
      'forest': { primary: '#059669', secondary: '#10b981', tertiary: '#34d399' },
      'navy': { primary: '#1e3a8a', secondary: '#3b82f6', tertiary: '#60a5fa' },
      'wine': { primary: '#9f1239', secondary: '#e11d48', tertiary: '#fb7185' },
      'amber': { primary: '#d97706', secondary: '#f59e0b', tertiary: '#fbbf24' },
      'gold': { primary: '#eab308', secondary: '#facc15', tertiary: '#fde047' }
    };
    return themeMap[themeName] || themeMap['forest'];
  };

  const orbColors = getOrbColors(colors?.name || 'forest');
  const isLoggedIn = !!user;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#7dd3fc]">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 30%, #e0f2fe 100%)' }}
        />
        <div
          className="absolute top-[10%] right-[10%] w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fff9c4 0%, #fde68a 30%, rgba(253,230,138,0) 70%)',
            filter: 'blur(8px)',
            boxShadow: '0 0 60px 20px rgba(253, 230, 138, 0.3)'
          }}
        />
        <div className="absolute top-[15%] left-[10%] opacity-80" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="relative" style={{ filter: 'blur(12px)' }}>
            <div className="absolute w-24 h-24 bg-white rounded-full" style={{ top: 0, left: 0 }} />
            <div className="absolute w-32 h-32 bg-white rounded-full" style={{ top: -20, left: 40 }} />
            <div className="absolute w-28 h-28 bg-white rounded-full" style={{ top: 10, left: 90 }} />
          </div>
        </div>
        <div className="absolute top-[25%] right-[15%] opacity-70" style={{ animation: 'float 9s ease-in-out infinite reverse' }}>
          <div className="relative" style={{ filter: 'blur(14px)' }}>
            <div className="absolute w-36 h-36 bg-white rounded-full" style={{ top: 0, left: 0 }} />
            <div className="absolute w-40 h-40 bg-white rounded-full" style={{ top: -25, left: 50 }} />
            <div className="absolute w-32 h-32 bg-white rounded-full" style={{ top: 15, left: 120 }} />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%]"
          style={{ background: 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0) 100%)' }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-transparent w-screen h-screen" style={{ minHeight: '100vh', minWidth: '100vw' }}>
      <div className="absolute inset-0">
        <div
          className="absolute top-[5%] left-[10%] w-[50vw] h-[50vw] rounded-full filter blur-[120px] opacity-30 animate-blob-1"
          style={{ backgroundColor: orbColors.primary, transition: 'background-color 1s ease' }}
        />
        <div
          className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] rounded-full filter blur-[120px] opacity-25 animate-blob-2"
          style={{ backgroundColor: orbColors.secondary, transition: 'background-color 1s ease' }}
        />
        <div
          className="absolute top-[50%] left-[50%] w-[40vw] h-[40vw] rounded-full filter blur-[100px] opacity-18 animate-blob-3"
          style={{ backgroundColor: orbColors.tertiary, transition: 'background-color 1s ease' }}
        />
      </div>
    </div>
  );
}