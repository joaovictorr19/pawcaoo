import React from "react";
import { getTierColor, getAnimationClass, getGlowStyle, calculateTier } from "./tierSystem";

/**
 * SVG Donut Chart para exibir progresso de nível
 * TEMA DARK MAGMA com animações graduais
 */
export default function LevelDonut({ 
  level = 0, 
  progress = 0,
  size = 140,
  strokeWidth = 12 
}) {
  const color = getTierColor(level);
  const tier = calculateTier(level * 100 + progress);
  const animationClass = getAnimationClass(level);
  const glowStyle = getGlowStyle(level, color);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  // Determinar intensidade do brilho baseado no nível
  const getGlowFilter = () => {
    if (level >= 100) return `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color}80)`;
    if (level >= 80) return `drop-shadow(0 0 14px ${color}90) drop-shadow(0 0 28px ${color}50)`;
    if (level >= 40) return `drop-shadow(0 0 10px ${color}70)`;
    return `drop-shadow(0 0 6px ${color}40)`;
  };

  return (
    <div 
      className={`relative ${animationClass}`} 
      style={{ width: size, height: size }}
    >
      {/* Glow background for higher levels */}
      {level >= 40 && (
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            filter: 'blur(8px)',
            transform: 'scale(1.3)',
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 relative z-10"
      >
        {/* Background circle - Dark theme */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2d2d2d"
          strokeWidth={strokeWidth}
        />
        
        {/* Subtle inner glow */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth/2}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.2}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease',
            filter: getGlowFilter()
          }}
        />

        {/* Extra glow layers for high levels */}
        {level >= 60 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            opacity={0.15}
            style={{ filter: 'blur(6px)' }}
          />
        )}
        
        {level >= 80 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            opacity={0.1}
            style={{ filter: 'blur(10px)' }}
          />
        )}
      </svg>

      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center z-20"
        style={{ transform: 'rotate(0deg)' }}
      >
        {/* Level number with dynamic glow */}
        <span 
          className="font-black leading-none tracking-tighter"
          style={{ 
            color,
            fontSize: size * 0.32,
            textShadow: level >= 40 
              ? `0 0 ${level >= 80 ? 30 : 20}px ${color}${level >= 80 ? '80' : '50'}` 
              : 'none',
            ...glowStyle
          }}
        >
          {level}
        </span>
        
        {/* "Nível" label */}
        <span 
          className="font-bold uppercase tracking-wider"
          style={{ 
            fontSize: size * 0.08,
            color: level >= 80 ? color : '#9ca3af',
            opacity: level >= 80 ? 0.9 : 1
          }}
        >
          Nível
        </span>
        
        {/* XP Progress */}
        <span 
          className="font-semibold"
          style={{ 
            fontSize: size * 0.09,
            color: level >= 60 ? `${color}cc` : '#9ca3af'
          }}
        >
          {Math.round(progress)}/100 XP
        </span>
      </div>
      
      {/* Legendary sparkle particles for level 100 */}
      {level >= 100 && (
        <>
          <div 
            className="absolute animate-spark"
            style={{ 
              top: '10%', 
              left: '20%',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#FFD700',
              boxShadow: '0 0 6px #FFD700'
            }}
          />
          <div 
            className="absolute animate-spark"
            style={{ 
              top: '15%', 
              right: '25%',
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: '#FFA500',
              boxShadow: '0 0 4px #FFA500',
              animationDelay: '0.3s'
            }}
          />
          <div 
            className="absolute animate-spark"
            style={{ 
              bottom: '20%', 
              left: '15%',
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: '#FFD700',
              boxShadow: '0 0 4px #FFD700',
              animationDelay: '0.6s'
            }}
          />
        </>
      )}
    </div>
  );
}