import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { getTierColor, calculateTier } from "./tierSystem";

/**
 * Componente de Pódio Visual para Top 3
 * - 1º Lugar: Centro, foto grande, borda na cor do nível + efeito brilho
 * - 2º Lugar: Esquerda, foto média, posicionado abaixo
 * - 3º Lugar: Direita, foto média, mesma linha do 2º
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

  // Obter cor do nível para cada posição
  const getColor = (user) => {
    if (rankingType === 'global') {
      return getTierColor(user?.gamification_level || calculateTier(user?.gamification_xp || 0).level);
    }
    // Para outros rankings, usar cor baseada na posição
    return null;
  };

  const PodiumCard = ({ user, position, className = "" }) => {
    if (!user) return null;
    
    const levelColor = getColor(user);
    const isFirst = position === 1;
    const photoSize = isFirst ? "w-24 h-24 md:w-32 md:h-32" : "w-18 h-18 md:w-24 md:h-24";
    const pedestalHeight = isFirst ? "h-40 md:h-48" : "h-32 md:h-36";
    
    // Cores do pedestal por posição
    const pedestalColors = {
      1: 'from-yellow-400 to-amber-500',
      2: 'from-gray-300 to-slate-400',
      3: 'from-orange-400 to-amber-600'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 }}
        className={`flex flex-col items-center ${className}`}
      >
        {/* Foto com borda na cor do nível */}
        <div className="relative mb-3">
          {/* Coroa para 1º lugar */}
          {isFirst && (
            <motion.div 
              className="absolute -top-8 left-1/2 -translate-x-1/2 z-10"
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 drop-shadow-lg" 
                     style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
            </motion.div>
          )}

          {/* Container da foto */}
          <div 
            className={`${photoSize} rounded-2xl overflow-hidden relative`}
            style={{
              border: `4px solid ${levelColor || (position === 1 ? '#fbbf24' : position === 2 ? '#9ca3af' : '#f97316')}`,
              boxShadow: isFirst 
                ? `0 0 30px ${levelColor || '#fbbf24'}60, 0 8px 32px rgba(0,0,0,0.2)` 
                : '0 4px 16px rgba(0,0,0,0.15)'
            }}
          >
            {user.profile_photo_url ? (
              <img 
                src={user.profile_photo_url} 
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-white font-black text-2xl md:text-3xl"
                style={{ backgroundColor: levelColor || '#3b82f6' }}
              >
                {user.full_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Badge de posição */}
          <div 
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${isFirst ? 'w-10 h-10' : 'w-8 h-8'} rounded-xl flex items-center justify-center font-black text-white shadow-lg`}
            style={{
              background: position === 1 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                : position === 2 
                  ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                  : 'linear-gradient(135deg, #f97316, #ea580c)'
            }}
          >
            {position}
          </div>
        </div>

        {/* Pedestal */}
        <div 
          className={`${pedestalHeight} w-28 md:w-36 bg-gradient-to-b ${pedestalColors[position]} rounded-t-2xl flex flex-col items-center justify-center px-3 shadow-xl`}
        >
          {isFirst && <Trophy className="w-7 h-7 md:w-8 md:h-8 text-white/90 mb-2" />}
          {!isFirst && <Medal className="w-6 h-6 text-white/90 mb-1" />}
          
          <p className="font-bold text-white text-sm md:text-base text-center truncate w-full">
            {user.full_name}
          </p>
          
          <p className="text-white/80 text-xs md:text-sm font-semibold mt-1">
            {formatMetric(user)}
          </p>

          {/* Indicador de nível com cor */}
          {rankingType === 'global' && levelColor && (
            <div 
              className="mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: `${levelColor}CC` }}
            >
              Nv. {user.gamification_level || calculateTier(user.gamification_xp || 0).level}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-3 md:gap-6 py-8">
      {/* 2º Lugar - Esquerda */}
      <PodiumCard user={second} position={2} />
      
      {/* 1º Lugar - Centro (mais alto) */}
      <PodiumCard user={first} position={1} className="relative z-10" />
      
      {/* 3º Lugar - Direita */}
      <PodiumCard user={third} position={3} />
    </div>
  );
}