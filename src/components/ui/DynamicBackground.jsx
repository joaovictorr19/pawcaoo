import React from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { PawPrint, Bone } from "lucide-react";


function SymbolSvg({ type, color, size }) {
  const s = size || 48;
  const common = { width: s, height: s, viewBox: "0 0 100 100", fill: "none" };
  const stroke = { stroke: color, strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (type === "dog") {
    return (
      <svg {...common}>
        <path d="M30,78 Q28,52 40,46 L40,40 Q40,28 52,28 Q64,28 64,42 L64,48 Q76,52 74,76 Q72,84 64,82 L36,82 Q30,82 30,78 Z" {...stroke} fill={`${color}10`} />
        <path d="M64,42 Q72,36 74,46 Q75,54 68,54" {...stroke} fill={`${color}10`} />
        <path d="M66,32 Q60,24 58,34 Q58,40 64,40" {...stroke} fill={`${color}18`} />
        <circle cx="69" cy="44" r="1.8" fill={color} />
        <circle cx="74" cy="48" r="1.6" fill={color} />
        <path d="M30,70 Q20,58 24,46" {...stroke} />
        <path d="M40,80 L40,88 M52,80 L52,88 M58,80 L58,88 M64,80 L64,88" {...stroke} />
        <path d="M70,50 Q72,52 74,50" {...stroke} />
      </svg>
    );
  }

  if (type === "hotel") {
    return (
      <svg {...common}>
        <path d="M20,44 L50,22 L80,44" {...stroke} fill={`${color}12`} />
        <path d="M26,44 L26,80 L74,80 L74,44" {...stroke} fill={`${color}08`} />
        <path d="M44,80 L44,60 L56,60 L56,80" {...stroke} fill={`${color}14`} />
        <circle cx="50" cy="70" r="3" fill={color} opacity={0.6} />
        <path d="M34,52 L40,52 L40,58 L34,58 Z" {...stroke} />
        <path d="M60,52 L66,52 L66,58 L60,58 Z" {...stroke} />
        <path d="M50,28 Q48,24 45,26 Q45,30 50,32 Q55,30 55,26 Q52,24 50,28 Z" fill={color} opacity={0.5} />
      </svg>
    );
  }

  if (type === "bowl") {
    return (
      <svg {...common}>
        <path d="M22,50 L78,50 Q76,78 50,80 Q24,78 22,50 Z" {...stroke} fill={`${color}10`} />
        <path d="M20,50 Q50,44 80,50" {...stroke} />
        <circle cx="38" cy="48" r="3" fill={color} opacity={0.5} />
        <circle cx="50" cy="46" r="3.5" fill={color} opacity={0.6} />
        <circle cx="62" cy="48" r="3" fill={color} opacity={0.5} />
        <circle cx="44" cy="42" r="2.5" fill={color} opacity={0.4} />
        <circle cx="58" cy="42" r="2.5" fill={color} opacity={0.4} />
      </svg>
    );
  }

  if (type === "frisbee") {
    return (
      <svg {...common}>
        <ellipse cx="50" cy="55" rx="34" ry="14" {...stroke} fill={`${color}18`} />
        <ellipse cx="50" cy="52" rx="30" ry="10" {...stroke} fill="none" />
        <path d="M22,50 Q50,40 78,50" {...stroke} />
      </svg>
    );
  }

  if (type === "leash") {
    return (
      <svg {...common}>
        <path d="M20,80 Q50,20 80,80 Q70,60 60,75 Q55,60 50,74 Q45,58 40,73 Q30,55 20,80" {...stroke} fill="none" />
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoggedIn = !!user;
  const location = useLocation();
  const showAnimatedBg = !isLoggedIn || ["/", "/Home", "/Shop"].includes(location.pathname);

  if (showAnimatedBg) {
    const TEAL = "#00a699";
    const ORANGE = "#ff6633";
    const YELLOW = "#ffcc33";
    const COLORS = [TEAL, ORANGE, YELLOW];

    const SYMBOLS = ["hotel", "paw", "bone", "ball", "paw", "bone", "hotel", "ball"];
    const COUNT = 22;

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
        <div
          className="absolute top-[-8%] right-[-4%] w-[420px] h-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(255,204,51,0.18), transparent 65%)` }}
        />
        <div
          className="absolute bottom-[-10%] left-[-6%] w-[380px] h-[380px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(0,166,153,0.14), transparent 65%)` }}
        />

        {fallingItems.map((item) => (
          <div
            key={item.key}
            className="absolute"
            style={{
              left: item.left,
              top: "-8%",
              opacity: item.opacity,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.04))",
              willChange: "transform",
              "--bg-sway": `${item.sway}px`,
              "--bg-rotate": `${item.rotate}deg`,
              animation: `bgFall ${item.duration}s linear ${item.delay}s infinite`,
            }}
          >
            {item.symbol === "paw" ? (
              <PawPrint size={item.size} strokeWidth={2} fill="none" style={{ color: item.color }} />
            ) : item.symbol === "bone" ? (
              <Bone size={item.size} strokeWidth={2.2} fill="none" style={{ color: item.color }} />
            ) : (
              <SymbolSvg type={item.symbol} color={item.color} size={item.size} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-transparent w-screen" style={{ minHeight: '100dvh', minWidth: '100vw' }} />
  );
}