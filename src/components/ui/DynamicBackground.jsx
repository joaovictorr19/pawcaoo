import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useTheme } from "../ThemeContext";
import { motion } from "framer-motion";
import { PawPrint, Bone, Heart, Star, Sparkles } from "lucide-react";


function SymbolSvg({ type, color, size }) {
  const s = size || 48;
  const common = { width: s, height: s, viewBox: "0 0 100 100", fill: "none" };
  const stroke = { stroke: color, strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (type === "dog") {
    // Simple happy dog silhouette (sitting, side view)
    return (
      <svg {...common}>
        {/* Body */}
        <path d="M30,78 Q28,52 40,46 L40,40 Q40,28 52,28 Q64,28 64,42 L64,48 Q76,52 74,76 Q72,84 64,82 L36,82 Q30,82 30,78 Z" {...stroke} fill={`${color}10`} />
        {/* Head */}
        <path d="M64,42 Q72,36 74,46 Q75,54 68,54" {...stroke} fill={`${color}10`} />
        {/* Ear */}
        <path d="M66,32 Q60,24 58,34 Q58,40 64,40" {...stroke} fill={`${color}18`} />
        {/* Eye */}
        <circle cx="69" cy="44" r="1.8" fill={color} />
        {/* Nose */}
        <circle cx="74" cy="48" r="1.6" fill={color} />
        {/* Tail */}
        <path d="M30,70 Q20,58 24,46" {...stroke} />
        {/* Legs */}
        <path d="M40,80 L40,88 M52,80 L52,88 M58,80 L58,88 M64,80 L64,88" {...stroke} />
        {/* Smile */}
        <path d="M70,50 Q72,52 74,50" {...stroke} />
      </svg>
    );
  }

  if (type === "hotel") {
    // House / hotel with paw on door
    return (
      <svg {...common}>
        {/* Roof */}
        <path d="M20,44 L50,22 L80,44" {...stroke} fill={`${color}12`} />
        {/* House body */}
        <path d="M26,44 L26,80 L74,80 L74,44" {...stroke} fill={`${color}08`} />
        {/* Door */}
        <path d="M44,80 L44,60 L56,60 L56,80" {...stroke} fill={`${color}14`} />
        {/* Paw on door */}
        <circle cx="50" cy="70" r="3" fill={color} opacity={0.6} />
        {/* Window */}
        <path d="M34,52 L40,52 L40,58 L34,58 Z" {...stroke} />
        <path d="M60,52 L66,52 L66,58 L60,58 Z" {...stroke} />
        {/* Heart on roof peak */}
        <path d="M50,28 Q48,24 45,26 Q45,30 50,32 Q55,30 55,26 Q52,24 50,28 Z" fill={color} opacity={0.5} />
      </svg>
    );
  }

  if (type === "bowl") {
    // Food bowl with kibble
    return (
      <svg {...common}>
        {/* Bowl */}
        <path d="M22,50 L78,50 Q76,78 50,80 Q24,78 22,50 Z" {...stroke} fill={`${color}10`} />
        {/* Rim */}
        <path d="M20,50 Q50,44 80,50" {...stroke} />
        {/* Kibble */}
        <circle cx="38" cy="48" r="3" fill={color} opacity={0.5} />
        <circle cx="50" cy="46" r="3.5" fill={color} opacity={0.6} />
        <circle cx="62" cy="48" r="3" fill={color} opacity={0.5} />
        <circle cx="44" cy="42" r="2.5" fill={color} opacity={0.4} />
        <circle cx="58" cy="42" r="2.5" fill={color} opacity={0.4} />
      </svg>
    );
  }

  if (type === "frisbee") {
    // Flying disc
    return (
      <svg {...common}>
        <ellipse cx="50" cy="55" rx="34" ry="14" {...stroke} fill={`${color}18`} />
        <ellipse cx="50" cy="52" rx="30" ry="10" {...stroke} fill="none" />
        <path d="M22,50 Q50,40 78,50" {...stroke} />
      </svg>
    );
  }

  if (type === "leash") {
    // Curled leash
    return (
      <svg {...common}>
        <path d="M20,80 Q50,20 80,80 Q70,60 60,75 Q55,60 50,74 Q45,58 40,73 Q30,55 20,80" {...stroke} fill="none" />
        {/* Clip */}
        <circle cx="80" cy="80" r="4" {...stroke} fill={`${color}20`} />
      </svg>
    );
  }

  if (type === "cloud") {
    return (
      <svg {...common} fill={color} opacity={0.5}>
        <path d="M24,60 Q14,60 14,50 Q14,42 24,42 Q26,30 40,30 Q54,30 56,42 Q68,42 68,52 Q68,60 58,60 Z" />
      </svg>
    );
  }

  if (type === "ball") {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="28" fill={color} opacity={0.55} stroke="white" strokeWidth={3} />
        <path d="M24,50 Q50,30 76,50" fill="none" stroke="white" strokeWidth={2.5} opacity={0.7} strokeLinecap="round" />
        <path d="M24,50 Q50,70 76,50" fill="none" stroke="white" strokeWidth={2.5} opacity={0.7} strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

export default function DynamicBackground() {
  const [weather, setWeather] = useState('sunny');
  const { colors } = useTheme(); // MUST be before any conditional return

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await getCurrentUser();
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
    const TEAL = "#00a699";
    const ORANGE = "#ff6633";
    const YELLOW = "#ffcc33";
    const COLORS = [TEAL, ORANGE, YELLOW];

    // Falling symbols — hotel, paw, bone, ball
    const SYMBOLS = ["hotel", "paw", "bone", "ball", "paw", "bone", "hotel", "ball"];
    const COUNT = 22;

    // Deterministic pseudo-random for stable layout
    const rand = (seed) => {
      const x = Math.sin(seed * 999.13) * 10000;
      return x - Math.floor(x);
    };

    const fallingItems = Array.from({ length: COUNT }, (_, i) => {
      const r1 = rand(i + 1);
      const r2 = rand(i + 7);
      const r3 = rand(i + 13);
      const r4 = rand(i + 21);
      const symbol = SYMBOLS[i % SYMBOLS.length];
      const color = COLORS[i % COLORS.length];
      const left = `${4 + r1 * 92}%`;
      const size = symbol === "hotel" ? 38 + r2 * 22 : 26 + r2 * 18;
      const duration = 16 + r3 * 14;
      const delay = -(r4 * duration);
      const sway = 14 + r1 * 22;
      const rotate = (r2 - 0.5) * 40;
      const opacity = 0.16 + r3 * 0.16;
      return { symbol, color, left, size, duration, delay, sway, rotate, opacity, key: i };
    });

    return (
      <div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
        style={{ background: "linear-gradient(180deg, #d4f5f3 0%, #e8fbf9 30%, #f4fefc 60%, #ffffff 100%)" }}
      >
        {/* Soft sun glow top */}
        <div
          className="absolute top-[-8%] right-[-4%] w-[420px] h-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(255,204,51,0.18), transparent 65%)` }}
        />
        {/* Soft teal glow bottom */}
        <div
          className="absolute bottom-[-10%] left-[-6%] w-[380px] h-[380px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(0,166,153,0.14), transparent 65%)` }}
        />

        {/* Falling symbols */}
        {fallingItems.map((item) => (
          <motion.div
            key={item.key}
            className="absolute"
            style={{
              left: item.left,
              top: "-8%",
              opacity: item.opacity,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.04))",
            }}
            animate={{
              y: ["0vh", "116vh"],
              x: [0, item.sway, -item.sway * 0.6, item.sway * 0.3, 0],
              rotate: [item.rotate, item.rotate + 30, item.rotate - 20, item.rotate + 10, item.rotate],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "linear",
            }}
          >
            {item.symbol === "paw" ? (
              <PawPrint size={item.size} strokeWidth={2} fill="none" style={{ color: item.color }} />
            ) : item.symbol === "bone" ? (
              <Bone size={item.size} strokeWidth={2.2} fill="none" style={{ color: item.color }} />
            ) : (
              <SymbolSvg type={item.symbol} color={item.color} size={item.size} />
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-transparent w-screen h-screen" style={{ minHeight: '100vh', minWidth: '100vw' }} />
  );
}