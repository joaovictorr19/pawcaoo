import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";
import { PawPrint, Heart } from "lucide-react";

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
    const floatItems = [
      { Icon: PawPrint, pos: "top-[6%] left-[4%]", color: "#00a699", size: 44, delay: 0, dur: 7 },
      { Icon: Heart, pos: "top-[10%] right-[6%]", color: "#ff6633", size: 30, delay: 1.5, dur: 6 },
      { Icon: PawPrint, pos: "top-[28%] left-[9%]", color: "#ff6633", size: 36, delay: 0.8, dur: 8 },
      { Icon: Heart, pos: "top-[38%] right-[4%]", color: "#00a699", size: 26, delay: 2, dur: 7 },
      { Icon: PawPrint, pos: "bottom-[18%] left-[5%]", color: "#00a699", size: 40, delay: 1.2, dur: 6.5 },
      { Icon: Heart, pos: "bottom-[12%] right-[7%]", color: "#ff6633", size: 34, delay: 2.5, dur: 7.5 },
      { Icon: PawPrint, pos: "bottom-[42%] right-[14%]", color: "#ff6633", size: 28, delay: 3, dur: 6 },
      { Icon: Heart, pos: "top-[52%] left-[16%]", color: "#00a699", size: 22, delay: 1.8, dur: 5.5 },
      { Icon: PawPrint, pos: "top-[68%] right-[22%]", color: "#00a699", size: 34, delay: 0.4, dur: 7 },
      { Icon: Heart, pos: "top-[18%] left-[32%]", color: "#ff6633", size: 24, delay: 3.2, dur: 6.8 },
      { Icon: PawPrint, pos: "bottom-[55%] left-[28%]", color: "#ff6633", size: 30, delay: 2.2, dur: 7.2 },
      { Icon: Heart, pos: "bottom-[30%] right-[30%]", color: "#00a699", size: 28, delay: 0.6, dur: 6.3 },
    ];

    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: "linear-gradient(180deg, #e0f7f6 0%, #f0fdfa 40%, #ffffff 100%)" }}>
        {floatItems.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.pos}`}
            animate={{ y: [0, -18, 0], rotate: [0, 8, -4, 0] }}
            transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
          >
            <item.Icon
              size={item.size}
              style={{ color: item.color, opacity: 0.2, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.06))" }}
              strokeWidth={2}
              fill="currentColor"
            />
          </motion.div>
        ))}
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