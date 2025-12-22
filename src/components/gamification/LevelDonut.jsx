import React from "react";
import { getTierColor } from "./tierSystem";

/**
 * SVG Donut Chart para exibir progresso de nível
 * SISTEMA LINEAR: 100 XP = 1 Nível
 * progress = totalXP % 100 (0-99, barra de 0 a 100)
 * No centro: número do nível + progresso atual
 */
export default function LevelDonut({ 
  level = 0, 
  progress = 0, // 0-99 (XP dentro do nível atual)
  size = 140,
  strokeWidth = 12 
}) {
  const color = getTierColor(level);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // progress vai de 0 a 99, representando XP dentro do nível
  const progressOffset = circumference - (progress / 100) * circumference;
  const center = size / 2;
  const xpToNext = 100 - progress; // XP restante para próximo nível

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
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
            filter: `drop-shadow(0 0 6px ${color}40)`
          }}
        />

        {/* Glow effect for higher levels */}
        {level >= 50 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            opacity={0.2}
            style={{
              filter: `blur(4px)`
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'rotate(0deg)' }}
      >
        <span 
          className="font-black leading-none tracking-tighter"
          style={{ 
            color,
            fontSize: size * 0.32,
            textShadow: level >= 50 ? `0 0 20px ${color}40` : 'none'
          }}
        >
          {level}
        </span>
        <span 
          className="text-gray-500 font-bold uppercase tracking-wider"
          style={{ fontSize: size * 0.08 }}
        >
          Nível
        </span>
        {/* Progresso linear: X/100 XP (XP dentro do nível atual) */}
        <span 
          className="text-gray-400 font-semibold"
          style={{ fontSize: size * 0.09 }}
        >
          {Math.round(progress)}/100 XP
        </span>
      </div>
    </div>
  );
}