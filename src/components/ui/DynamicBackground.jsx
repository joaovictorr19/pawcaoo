import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";


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
    const ASSET_BALL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/5ec20bca0_Bola.png";
    const ASSET_BONE = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/2d3368286_osso.png";
    const ASSET_PAW_TEAL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/d327623b8_generated_image.png";
    const ASSET_PAW_CORAL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/4ca979d5f_generated_image.png";

    const floatItems = [
      { src: ASSET_PAW_TEAL, pos: "top-[6%] left-[4%]", size: 48, delay: 0, dur: 7, blend: "multiply" },
      { src: ASSET_BALL, pos: "top-[10%] right-[6%]", size: 38, delay: 1.5, dur: 6, blend: "screen" },
      { src: ASSET_PAW_CORAL, pos: "top-[28%] left-[9%]", size: 40, delay: 0.8, dur: 8, blend: "multiply" },
      { src: ASSET_BONE, pos: "top-[38%] right-[4%]", size: 46, delay: 2, dur: 7, blend: "multiply", rotate: 35 },
      { src: ASSET_PAW_TEAL, pos: "bottom-[18%] left-[5%]", size: 44, delay: 1.2, dur: 6.5, blend: "multiply" },
      { src: ASSET_BALL, pos: "bottom-[12%] right-[7%]", size: 42, delay: 2.5, dur: 7.5, blend: "screen" },
      { src: ASSET_PAW_CORAL, pos: "bottom-[42%] right-[14%]", size: 32, delay: 3, dur: 6, blend: "multiply" },
      { src: ASSET_BONE, pos: "top-[52%] left-[16%]", size: 38, delay: 1.8, dur: 5.5, blend: "multiply", rotate: -20 },
      { src: ASSET_PAW_TEAL, pos: "top-[68%] right-[22%]", size: 36, delay: 0.4, dur: 7, blend: "multiply" },
      { src: ASSET_BALL, pos: "top-[18%] left-[32%]", size: 30, delay: 3.2, dur: 6.8, blend: "screen" },
      { src: ASSET_PAW_CORAL, pos: "bottom-[55%] left-[28%]", size: 34, delay: 2.2, dur: 7.2, blend: "multiply" },
      { src: ASSET_BONE, pos: "bottom-[30%] right-[30%]", size: 40, delay: 0.6, dur: 6.3, blend: "multiply", rotate: 50 },
    ];

    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: "linear-gradient(180deg, #e0f7f6 0%, #f0fdfa 40%, #ffffff 100%)" }}>
        {floatItems.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.pos}`}
            animate={{ y: [0, -18, 0], rotate: [item.rotate || 0, (item.rotate || 0) + 10, (item.rotate || 0) - 6, item.rotate || 0] }}
            transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
          >
            <img
              src={item.src}
              alt=""
              aria-hidden="true"
              width={item.size}
              height={item.size}
              style={{
                width: item.size,
                height: item.size,
                objectFit: "contain",
                opacity: 0.4,
                mixBlendMode: item.blend,
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.06))",
              }}
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