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
    const TEAL_SOFT = "#5eead4";

    // Floating lucide icons — soft, scattered
    const floatItems = [
      { Icon: PawPrint, pos: "top-[6%] left-[4%]", color: TEAL, size: 44, delay: 0, dur: 7, rotate: 0 },
      { Icon: Bone, pos: "top-[10%] right-[6%]", color: ORANGE, size: 38, delay: 1.5, dur: 6, rotate: 0 },
      { Icon: Heart, pos: "top-[28%] left-[9%]", color: ORANGE, size: 36, delay: 0.8, dur: 8, rotate: 0 },
      { Icon: Star, pos: "bottom-[12%] right-[7%]", color: YELLOW, size: 38, delay: 2.5, dur: 7.5, rotate: 0 },
      { Icon: Sparkles, pos: "top-[18%] left-[32%]", color: YELLOW, size: 28, delay: 3.2, dur: 6.8, rotate: 0 },
      { Icon: Heart, pos: "bottom-[55%] left-[28%]", color: ORANGE, size: 32, delay: 2.2, dur: 7.2, rotate: 0 },
    ];

    // Custom SVG symbols positioned across the canvas
    const svgDecorations = [
      // Dog silhouettes (simple, happy)
      { type: "dog", pos: "top-[14%] right-[12%]", color: TEAL, size: 70, delay: 1.2, dur: 7, flip: true },
      { type: "dog", pos: "bottom-[16%] left-[8%]", color: ORANGE, size: 64, delay: 0.6, dur: 6.5, flip: false },
      // Hotel / house
      { type: "hotel", pos: "top-[44%] right-[5%]", color: TEAL, size: 58, delay: 2, dur: 8 },
      { type: "hotel", pos: "bottom-[8%] right-[16%]", color: ORANGE, size: 50, delay: 1.4, dur: 7 },
      // Food bowl
      { type: "bowl", pos: "top-[34%] left-[14%]", color: ORANGE, size: 46, delay: 0.9, dur: 6.8 },
      { type: "bowl", pos: "bottom-[40%] right-[22%]", color: TEAL, size: 42, delay: 2.4, dur: 7.3 },
      // Frisbee
      { type: "frisbee", pos: "top-[58%] left-[4%]", color: YELLOW, size: 52, delay: 1.7, dur: 6.2, rotate: 18 },
      { type: "frisbee", pos: "bottom-[30%] left-[40%]", color: TEAL, size: 44, delay: 3, dur: 7, rotate: -12 },
      // Leash curl
      { type: "leash", pos: "top-[72%] right-[10%]", color: ORANGE, size: 90, delay: 2.8, dur: 8 },
      // Clouds
      { type: "cloud", pos: "top-[3%] left-[28%]", color: "#ffffff", size: 80, delay: 0, dur: 12 },
      { type: "cloud", pos: "top-[8%] right-[30%]", color: "#ffffff", size: 64, delay: 4, dur: 14 },
      { type: "cloud", pos: "top-[50%] left-[38%]", color: "#ffffff", size: 72, delay: 6, dur: 13 },
      // Tennis ball
      { type: "ball", pos: "top-[60%] right-[28%]", color: YELLOW, size: 26, delay: 1.1, dur: 5.8 },
      { type: "ball", pos: "bottom-[48%] left-[20%]", color: YELLOW, size: 22, delay: 2.6, dur: 6.4 },
    ];

    // Paw print trail along the bottom
    const pawTrail = [
      { x: "8%", y: "88%", rotate: -12, delay: 0 },
      { x: "16%", y: "90%", rotate: 8, delay: 0.5 },
      { x: "24%", y: "86%", rotate: -5, delay: 1 },
      { x: "33%", y: "89%", rotate: 15, delay: 1.5 },
      { x: "42%", y: "85%", rotate: -8, delay: 2 },
      { x: "52%", y: "88%", rotate: 6, delay: 2.5 },
      { x: "61%", y: "86%", rotate: -14, delay: 3 },
      { x: "70%", y: "89%", rotate: 10, delay: 3.5 },
      { x: "79%", y: "85%", rotate: -6, delay: 4 },
      { x: "88%", y: "88%", rotate: 12, delay: 4.5 },
    ];

    return (
      <div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
        style={{ background: "linear-gradient(180deg, #d4f5f3 0%, #e8fbf9 30%, #f4fefc 60%, #ffffff 100%)" }}
      >
        {/* Soft sun glow top-right */}
        <div
          className="absolute top-[-8%] right-[-4%] w-[420px] h-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(255,204,51,0.22), transparent 65%)` }}
        />
        {/* Soft teal glow bottom-left */}
        <div
          className="absolute bottom-[-10%] left-[-6%] w-[380px] h-[380px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(0,166,153,0.16), transparent 65%)` }}
        />
        {/* Soft orange glow mid */}
        <div
          className="absolute top-[35%] left-[45%] w-[300px] h-[300px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(255,102,51,0.10), transparent 70%)` }}
        />

        {/* Floating lucide icons */}
        {floatItems.map((item, i) => (
          <motion.div
            key={`fi-${i}`}
            className={`absolute ${item.pos}`}
            animate={{ y: [0, -16, 0], rotate: [item.rotate, item.rotate + 8, item.rotate - 4, item.rotate] }}
            transition={{ duration: item.dur, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
          >
            <item.Icon
              size={item.size}
              strokeWidth={1.8}
              fill="none"
              style={{ color: item.color, opacity: 0.32, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.04))" }}
            />
          </motion.div>
        ))}

        {/* Custom SVG symbols */}
        {svgDecorations.map((d, i) => (
          <motion.div
            key={`svg-${i}`}
            className={`absolute ${d.pos}`}
            animate={{ y: [0, -12, 0], rotate: [d.rotate || 0, (d.rotate || 0) + 6, (d.rotate || 0) - 3, (d.rotate || 0)] }}
            transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
            style={{
              transform: d.flip ? "scaleX(-1)" : undefined,
              filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.05))",
            }}
          >
            <SymbolSvg type={d.type} color={d.color} size={d.size} />
          </motion.div>
        ))}

        {/* Paw print trail along bottom */}
        {pawTrail.map((p, i) => (
          <motion.div
            key={`trail-${i}`}
            className="absolute"
            style={{ left: p.x, top: p.y, transform: `rotate(${p.rotate}deg)` }}
            animate={{ opacity: [0.12, 0.26, 0.12] }}
            transition={{ duration: 4, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          >
            <PawPrint size={22} strokeWidth={2} fill="none" style={{ color: TEAL, opacity: 0.5 }} />
          </motion.div>
        ))}

        {/* Subtle dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(${TEAL} 1.2px, transparent 1.2px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-transparent w-screen h-screen" style={{ minHeight: '100vh', minWidth: '100vw' }} />
  );
}