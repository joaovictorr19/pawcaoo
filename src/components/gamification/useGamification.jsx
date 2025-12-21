import { useMemo } from 'react';

/**
 * SISTEMA DE GAMIFICAÇÃO CENTRALIZADO - 100 Níveis + 20 Tiers de Cor
 * Este é o "Source of Truth" para toda a lógica de XP, níveis e cores.
 */

// ==================== TABELA DE 20 TIERS ====================
export const TIER_COLORS = [
  { tier: 1, name: 'Bronze', minLevel: 1, maxLevel: 5, color: '#CD7F32', gradient: 'from-amber-600 to-amber-800', textClass: 'text-amber-700' },
  { tier: 2, name: 'Prata', minLevel: 6, maxLevel: 10, color: '#C0C0C0', gradient: 'from-gray-400 to-gray-600', textClass: 'text-gray-500' },
  { tier: 3, name: 'Ouro', minLevel: 11, maxLevel: 15, color: '#FFD700', gradient: 'from-yellow-400 to-yellow-600', textClass: 'text-yellow-600' },
  { tier: 4, name: 'Platina', minLevel: 16, maxLevel: 20, color: '#E5E4E2', gradient: 'from-slate-300 to-slate-500', textClass: 'text-slate-500' },
  { tier: 5, name: 'Diamante', minLevel: 21, maxLevel: 25, color: '#B9F2FF', gradient: 'from-cyan-300 to-cyan-500', textClass: 'text-cyan-500' },
  { tier: 6, name: 'Safira', minLevel: 26, maxLevel: 30, color: '#0F52BA', gradient: 'from-blue-500 to-blue-700', textClass: 'text-blue-600' },
  { tier: 7, name: 'Esmeralda', minLevel: 31, maxLevel: 35, color: '#50C878', gradient: 'from-emerald-400 to-emerald-600', textClass: 'text-emerald-500' },
  { tier: 8, name: 'Rubi', minLevel: 36, maxLevel: 40, color: '#E0115F', gradient: 'from-rose-500 to-rose-700', textClass: 'text-rose-600' },
  { tier: 9, name: 'Ametista', minLevel: 41, maxLevel: 45, color: '#9966CC', gradient: 'from-purple-400 to-purple-600', textClass: 'text-purple-500' },
  { tier: 10, name: 'Topázio', minLevel: 46, maxLevel: 50, color: '#FFC87C', gradient: 'from-orange-300 to-orange-500', textClass: 'text-orange-500' },
  { tier: 11, name: 'Obsidiana', minLevel: 51, maxLevel: 55, color: '#3D3D3D', gradient: 'from-gray-700 to-gray-900', textClass: 'text-gray-700' },
  { tier: 12, name: 'Celestial', minLevel: 56, maxLevel: 60, color: '#7DF9FF', gradient: 'from-sky-300 to-sky-500', textClass: 'text-sky-500' },
  { tier: 13, name: 'Aurora', minLevel: 61, maxLevel: 65, color: '#FF6EC7', gradient: 'from-pink-400 to-purple-500', textClass: 'text-pink-500' },
  { tier: 14, name: 'Nebulosa', minLevel: 66, maxLevel: 70, color: '#8B5CF6', gradient: 'from-violet-500 to-indigo-600', textClass: 'text-violet-600' },
  { tier: 15, name: 'Solar', minLevel: 71, maxLevel: 75, color: '#FF4500', gradient: 'from-orange-500 to-red-600', textClass: 'text-orange-600' },
  { tier: 16, name: 'Lunar', minLevel: 76, maxLevel: 80, color: '#F4F1DE', gradient: 'from-gray-200 to-indigo-300', textClass: 'text-indigo-400' },
  { tier: 17, name: 'Cósmico', minLevel: 81, maxLevel: 85, color: '#1E0342', gradient: 'from-indigo-800 to-purple-900', textClass: 'text-indigo-800' },
  { tier: 18, name: 'Eterno', minLevel: 86, maxLevel: 90, color: '#FFD700', gradient: 'from-yellow-300 via-amber-400 to-orange-500', textClass: 'text-amber-500' },
  { tier: 19, name: 'Lendário', minLevel: 91, maxLevel: 95, color: '#FF0080', gradient: 'from-pink-500 via-red-500 to-yellow-500', textClass: 'text-pink-600' },
  { tier: 20, name: 'Mítico', minLevel: 96, maxLevel: 100, color: '#00FFFF', gradient: 'from-cyan-400 via-purple-500 to-pink-500', textClass: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500' },
];

// ==================== CÁLCULOS DE XP ====================
// Fórmula: XP necessário para o nível N = 100 * N^1.5 (curva suave)
export const getXPForLevel = (level) => {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
};

export const getTotalXPForLevel = (level) => {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

export const getLevelFromXP = (xp) => {
  if (!xp || xp <= 0) return 1;
  
  let level = 1;
  let accumulatedXP = 0;
  
  while (level <= 100) {
    const xpNeeded = getXPForLevel(level + 1);
    if (accumulatedXP + xpNeeded > xp) break;
    accumulatedXP += xpNeeded;
    level++;
  }
  
  return Math.min(level, 100);
};

export const getProgressToNextLevel = (xp) => {
  const currentLevel = getLevelFromXP(xp);
  if (currentLevel >= 100) return { progress: 100, currentXP: xp, neededXP: 0, remaining: 0 };
  
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  
  return {
    progress: Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100)),
    currentXP: xpInCurrentLevel,
    neededXP: xpNeededForNext,
    remaining: xpNeededForNext - xpInCurrentLevel
  };
};

// ==================== TIER HELPERS ====================
export const getTierForLevel = (level) => {
  const tier = TIER_COLORS.find(t => level >= t.minLevel && level <= t.maxLevel);
  return tier || TIER_COLORS[0];
};

export const getTierForXP = (xp) => {
  const level = getLevelFromXP(xp);
  return getTierForLevel(level);
};

// ==================== HOOK PRINCIPAL ====================
export function useGamification(user) {
  return useMemo(() => {
    const xp = user?.gamification_xp || 0;
    const level = getLevelFromXP(xp);
    const tier = getTierForLevel(level);
    const progress = getProgressToNextLevel(xp);
    
    return {
      // Dados brutos
      xp,
      level,
      
      // Tier atual
      tier,
      tierName: tier.name,
      tierColor: tier.color,
      tierGradient: tier.gradient,
      tierTextClass: tier.textClass,
      tierNumber: tier.tier,
      
      // Progresso
      progressPercent: progress.progress,
      xpInLevel: progress.currentXP,
      xpNeededForNext: progress.neededXP,
      xpRemaining: progress.remaining,
      
      // Helpers
      isMaxLevel: level >= 100,
      nextLevel: Math.min(level + 1, 100),
      nextTier: TIER_COLORS.find(t => t.minLevel > level) || tier,
    };
  }, [user?.gamification_xp]);
}

// ==================== DISPLAY HELPERS ====================
export const formatXP = (xp) => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp?.toString() || '0';
};

export const getLevelTitle = (level) => {
  if (level >= 96) return '🌟 Mítico';
  if (level >= 91) return '🏆 Lendário';
  if (level >= 86) return '♾️ Eterno';
  if (level >= 81) return '🌌 Cósmico';
  if (level >= 76) return '🌙 Lunar';
  if (level >= 71) return '☀️ Solar';
  if (level >= 66) return '🌀 Nebulosa';
  if (level >= 61) return '🌈 Aurora';
  if (level >= 56) return '✨ Celestial';
  if (level >= 51) return '🖤 Obsidiana';
  if (level >= 46) return '🔶 Topázio';
  if (level >= 41) return '💜 Ametista';
  if (level >= 36) return '❤️ Rubi';
  if (level >= 31) return '💚 Esmeralda';
  if (level >= 26) return '💎 Safira';
  if (level >= 21) return '💠 Diamante';
  if (level >= 16) return '⬜ Platina';
  if (level >= 11) return '🥇 Ouro';
  if (level >= 6) return '🥈 Prata';
  return '🥉 Bronze';
};

export default useGamification;