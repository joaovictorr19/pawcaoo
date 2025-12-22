import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { getTierColor, calculateTier } from "./tierSystem";

/**
 * Componente de Pódio Visual para Top 3
 * Design: Ouro (centro alto), Prata (esquerda), Bronze (direita)
 */
export default function PodiumDisplay({ 
  rankedData = [], 
  rankingType = 'global',
  formatMetric = (v) => `${v}`
}) {
  if (rankedData.length === 0) return null;

  const first = rankedData[0];
  const second = rankedData[1];
  const third = rankedData[2];

  // Configuração visual por posição
  const positionConfig = {
    1: {
      gradient: 'from-yellow-300 via-yellow-400 to-amber-500',
      border: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.5)',
      medal: '🥇',
      pedestalHeight: 'h-32 md:h-40',
      photoSize: 'w-20 h-20 md:w-28 md:h-28',
      label: 'OURO'
    },
    2: {
      gradient: 'from-gray-200 via-gray-300 to-slate-400',
      border: '#9ca3af',
      glow: 'rgba(156, 163, 175, 0.4)',
      medal: '🥈',
      pedestalHeight: 'h-24 md:h-32',
      photoSize: 'w-16 h-16 md:w-24 md:h-24',
      label: 'PRATA'
    },
    3: {
      gradient: 'from-orange-300 via-orange-400 to-amber-600',
      border: '#f97316',
      glow: 'rgba(249, 115, 22, 0.4)',
      medal: '🥉',
      pedestalHeight: 'h-20 md:h-28',
      photoSize: 'w-16 h-16 md:w-24 md:h-24',
      label: 'BRONZE'
    }
  };

  const PodiumCard = ({ user, position }) => {
    if (!user) return null;
    
    const config = positionConfig[position];
    const levelColor = rankingType === 'global' 
      ? getTierColor(user?.gamification_level || calculateTier(user?.gamification_xp || 0).level)
      : config.border;
    const isFirst = position === 1;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: position === 1 ? 0.1 : position === 2 ? 0.2 : 0.3, type: "spring", stiffness: 100 }}
        className="flex flex-col items-center"
      >
        {/* Avatar Section */}
        <div className="relative mb-2">
          {/* Coroa animada para 1º lugar */}
          {isFirst && (
            <motion.div 
              className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 z-20"
              animate={{ y: [-3, 3, -3], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Crown 
                className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" 
                style={{ filter: 'drop-shadow(0 0 12px #fbbf24)' }}
                fill="#fbbf24"
              />
            </motion.div>
          )}

          {/* Glow ring */}
          <div 
            className={`absolute inset-0 ${config.photoSize} rounded-full blur-md`}
            style={{ background: config.glow, transform: 'scale(1.2)' }}
          />

          {/* Photo container */}
          <motion.div 
            className={`${config.photoSize} rounded-full overflow-hidden relative z-10`}
            style={{
              border: `4px solid ${config.border}`,
              boxShadow: `0 0 20px ${config.glow}, 0 8px 24px rgba(0,0,0,0.2)`
            }}
            whileHover={{ scale: 1.1 }}
          >
            {user.profile_photo_url ? (
              <img 
                src={user.profile_photo_url} 
                alt={user.full_name}
                className="w-full h-full aspect-square object-cover object-center"
              />
            ) : (
              <div 
                className={`w-full h-full flex items-center justify-center text-white font-black bg-gradient-to-br ${config.gradient}`}
                style={{ fontSize: isFirst ? '2rem' : '1.5rem' }}
              >
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </motion.div>

          {/* Medal badge */}
          <div 
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${isFirst ? 'text-3xl' : 'text-2xl'} z-20`}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            {config.medal}
          </div>
        </div>

        {/* Pedestal */}
        <motion.div 
          className={`${config.pedestalHeight} w-24 md:w-32 bg-gradient-to-b ${config.gradient} rounded-t-2xl flex flex-col items-center justify-start pt-4 px-2 shadow-2xl relative overflow-hidden`}
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ delay: position * 0.15, duration: 0.5 }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
          
          {/* Position number */}
          <div className="text-white/90 text-2xl md:text-3xl font-black mb-1 drop-shadow-lg">
            {position}º
          </div>
          
          {/* Name */}
          <p className="font-bold text-white text-xs md:text-sm text-center truncate w-full drop-shadow-md">
            {user.full_name?.split(' ')[0] || 'User'}
          </p>
          
          {/* Metric */}
          <p className="text-white/90 text-[10px] md:text-xs font-semibold mt-1 drop-shadow">
            {formatMetric(user)}
          </p>

          {/* Level indicator for global ranking */}
          {rankingType === 'global' && (
            <div 
              className="mt-2 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold text-white/90 backdrop-blur-sm"
              style={{ backgroundColor: `${levelColor}90` }}
            >
              Nv.{user.gamification_level || calculateTier(user.gamification_xp || 0).level}
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="relative py-6 md:py-10">
      {/* Background glow */}
      <div className="absolute inset-0 flex justify-center items-end pointer-events-none">
        <div className="w-64 h-32 bg-gradient-to-t from-yellow-400/20 to-transparent blur-3xl" />
      </div>
      
      {/* Podium container - 2º, 1º, 3º order */}
      <div className="flex items-end justify-center gap-2 md:gap-4 relative z-10">
        {/* 2º Lugar - Prata (Esquerda) */}
        <div className="flex flex-col items-center">
          {second ? (
            <PodiumCard user={second} position={2} />
          ) : (
            <div className="w-24 md:w-32 h-24 md:h-32 rounded-t-2xl bg-gray-200/50 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">🥈</span>
            </div>
          )}
        </div>
        
        {/* 1º Lugar - Ouro (Centro, mais alto) */}
        <div className="flex flex-col items-center -mt-8 md:-mt-12">
          {first ? (
            <PodiumCard user={first} position={1} />
          ) : (
            <div className="w-24 md:w-32 h-32 md:h-40 rounded-t-2xl bg-yellow-200/50 flex items-center justify-center">
              <span className="text-yellow-400 text-3xl">🥇</span>
            </div>
          )}
        </div>
        
        {/* 3º Lugar - Bronze (Direita) */}
        <div className="flex flex-col items-center">
          {third ? (
            <PodiumCard user={third} position={3} />
          ) : (
            <div className="w-24 md:w-32 h-20 md:h-28 rounded-t-2xl bg-orange-200/50 flex items-center justify-center">
              <span className="text-orange-400 text-2xl">🥉</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Base do pódio */}
      <div className="flex justify-center mt-0">
        <div className="w-80 md:w-[420px] h-3 md:h-4 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-b-xl shadow-inner" />
      </div>
    </div>
  );
}