// ============================================
// TIER SYSTEM - 100 NÍVEIS, 20 CORES
// ============================================
// Nível 1-5: Cinza | Nível 96-100: Dourado Galáctico
// Cores mudam a cada 5 níveis

// Definição das 20 Cores (Tiers Visuais)
export const TIER_COLORS_BY_LEVEL = [
  // Níveis 1-5: Prata Iniciante
  { minLevel: 1, maxLevel: 5, name: 'Prata', icon: '⚪', primary: '#c0c0c0', gradient: 'from-gray-300 to-slate-500', orb1: '#94a3b8', orb2: '#cbd5e1', text: 'text-slate-500', bg: 'bg-slate-100' },
  // Níveis 6-10: Verde Musgo
  { minLevel: 6, maxLevel: 10, name: 'Musgo', icon: '🌿', primary: '#4d7c0f', gradient: 'from-lime-600 to-green-700', orb1: '#65a30d', orb2: '#a3e635', text: 'text-lime-600', bg: 'bg-lime-50' },
  // Níveis 11-15: Azul Celeste
  { minLevel: 11, maxLevel: 15, name: 'Celeste', icon: '🩵', primary: '#0ea5e9', gradient: 'from-sky-400 to-cyan-600', orb1: '#38bdf8', orb2: '#7dd3fc', text: 'text-sky-500', bg: 'bg-sky-50' },
  // Níveis 16-20: Bronze
  { minLevel: 16, maxLevel: 20, name: 'Bronze', icon: '🥉', primary: '#cd7f32', gradient: 'from-orange-400 to-amber-600', orb1: '#fb923c', orb2: '#fdba74', text: 'text-orange-600', bg: 'bg-orange-50' },
  // Níveis 21-25: Cobre
  { minLevel: 21, maxLevel: 25, name: 'Cobre', icon: '🔶', primary: '#b87333', gradient: 'from-orange-500 to-orange-700', orb1: '#ea580c', orb2: '#f97316', text: 'text-orange-700', bg: 'bg-orange-100' },
  // Níveis 26-30: Prata
  { minLevel: 26, maxLevel: 30, name: 'Prata', icon: '🥈', primary: '#c0c0c0', gradient: 'from-gray-300 to-slate-500', orb1: '#94a3b8', orb2: '#cbd5e1', text: 'text-slate-500', bg: 'bg-slate-100' },
  // Níveis 31-35: Jade
  { minLevel: 31, maxLevel: 35, name: 'Jade', icon: '🍀', primary: '#00a86b', gradient: 'from-emerald-400 to-teal-600', orb1: '#34d399', orb2: '#6ee7b7', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  // Níveis 36-40: Ouro
  { minLevel: 36, maxLevel: 40, name: 'Ouro', icon: '🥇', primary: '#ffd700', gradient: 'from-yellow-400 to-amber-500', orb1: '#facc15', orb2: '#fef08a', text: 'text-yellow-600', bg: 'bg-yellow-50' },
  // Níveis 41-45: Topázio
  { minLevel: 41, maxLevel: 45, name: 'Topázio', icon: '🔸', primary: '#ff8c00', gradient: 'from-amber-500 to-orange-600', orb1: '#f59e0b', orb2: '#fbbf24', text: 'text-amber-600', bg: 'bg-amber-50' },
  // Níveis 46-50: Safira
  { minLevel: 46, maxLevel: 50, name: 'Safira', icon: '💙', primary: '#1d4ed8', gradient: 'from-blue-500 to-indigo-700', orb1: '#3b82f6', orb2: '#60a5fa', text: 'text-blue-600', bg: 'bg-blue-50' },
  // Níveis 51-55: Ametista
  { minLevel: 51, maxLevel: 55, name: 'Ametista', icon: '💜', primary: '#9333ea', gradient: 'from-purple-500 to-violet-700', orb1: '#a855f7', orb2: '#c084fc', text: 'text-purple-600', bg: 'bg-purple-50' },
  // Níveis 56-60: Rubi
  { minLevel: 56, maxLevel: 60, name: 'Rubi', icon: '❤️', primary: '#e0115f', gradient: 'from-rose-500 to-red-700', orb1: '#f43f5e', orb2: '#fb7185', text: 'text-rose-600', bg: 'bg-rose-50' },
  // Níveis 61-65: Esmeralda
  { minLevel: 61, maxLevel: 65, name: 'Esmeralda', icon: '💚', primary: '#50c878', gradient: 'from-green-500 to-emerald-700', orb1: '#22c55e', orb2: '#4ade80', text: 'text-green-600', bg: 'bg-green-50' },
  // Níveis 66-70: Turquesa
  { minLevel: 66, maxLevel: 70, name: 'Turquesa', icon: '🩵', primary: '#40e0d0', gradient: 'from-teal-400 to-cyan-600', orb1: '#2dd4bf', orb2: '#5eead4', text: 'text-teal-500', bg: 'bg-teal-50' },
  // Níveis 71-75: Platina
  { minLevel: 71, maxLevel: 75, name: 'Platina', icon: '⬜', primary: '#e5e4e2', gradient: 'from-gray-200 via-slate-300 to-gray-400', orb1: '#e2e8f0', orb2: '#f1f5f9', text: 'text-slate-400', bg: 'bg-slate-50' },
  // Níveis 76-80: Diamante
  { minLevel: 76, maxLevel: 80, name: 'Diamante', icon: '💎', primary: '#b9f2ff', gradient: 'from-cyan-300 via-blue-200 to-white', orb1: '#22d3ee', orb2: '#e0f2fe', text: 'text-cyan-400', bg: 'bg-cyan-50' },
  // Níveis 81-85: Obsidiana
  { minLevel: 81, maxLevel: 85, name: 'Obsidiana', icon: '🖤', primary: '#1e1e1e', gradient: 'from-gray-800 via-slate-900 to-black', orb1: '#374151', orb2: '#1f2937', text: 'text-gray-300', bg: 'bg-gray-900', isDark: true },
  // Níveis 86-90: Fénix
  { minLevel: 86, maxLevel: 90, name: 'Fénix', icon: '🔥', primary: '#ff4500', gradient: 'from-red-500 via-orange-500 to-yellow-500', orb1: '#ef4444', orb2: '#f97316', text: 'text-orange-500', bg: 'bg-orange-50' },
  // Níveis 91-95: Cosmos
  { minLevel: 91, maxLevel: 95, name: 'Cosmos', icon: '🌌', primary: '#8b5cf6', gradient: 'from-violet-600 via-purple-800 to-indigo-900', orb1: '#7c3aed', orb2: '#4c1d95', text: 'text-violet-500', bg: 'bg-violet-950', isDark: true },
  // Níveis 96-100: Dourado Galáctico
  { minLevel: 96, maxLevel: 100, name: 'Galáctico', icon: '✨', primary: '#ffd700', gradient: 'from-yellow-300 via-amber-400 to-orange-500', orb1: '#fbbf24', orb2: '#fef3c7', text: 'text-yellow-500', bg: 'bg-gradient-to-br from-yellow-50 to-amber-100', isLegendary: true }
];

// XP necessário por nível (progressão quadrática suave)
// Nível 1 = 0 XP, Nível 100 = ~500,000 XP
export function getXPForLevel(level) {
  if (level <= 1) return 0;
  // Fórmula: (level^2) * 50, criando curva suave
  return Math.floor(Math.pow(level - 1, 2) * 50);
}

// Calcular nível a partir de XP
export function getLevelFromXP(xp) {
  if (!xp || xp <= 0) return 1;
  // Inverso da fórmula: sqrt(xp / 50) + 1
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  return Math.min(100, Math.max(1, level));
}

// Obter Tier (cor) baseado no nível
export function getTierByLevel(level) {
  const safeLevel = Math.min(100, Math.max(1, level || 1));
  for (const tier of TIER_COLORS_BY_LEVEL) {
    if (safeLevel >= tier.minLevel && safeLevel <= tier.maxLevel) {
      return { ...tier };
    }
  }
  return TIER_COLORS_BY_LEVEL[0];
}

// Função principal: calcular tudo a partir de XP
export function calculateTier(xp) {
  const safeXP = Number(xp) || 0;
  const level = getLevelFromXP(safeXP);
  const tier = getTierByLevel(level);
  
  // Calcular progresso para próximo nível
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInCurrentLevel = safeXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progress = level >= 100 ? 100 : Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
  const xpToNextLevel = level >= 100 ? 0 : nextLevelXP - safeXP;

  return {
    level,
    name: tier.name,
    icon: tier.icon,
    primary: tier.primary,
    gradient: tier.gradient,
    orb1: tier.orb1,
    orb2: tier.orb2,
    text: tier.text,
    bg: tier.bg,
    isDark: tier.isDark || false,
    isLegendary: tier.isLegendary || false,
    min: currentLevelXP,
    max: nextLevelXP,
    progress: Math.round(progress),
    xpToNextLevel,
    tierRange: `${tier.minLevel}-${tier.maxLevel}`,
    colors: {
      primary: tier.primary,
      gradient: tier.gradient,
      orb1: tier.orb1,
      orb2: tier.orb2
    }
  };
}

// Alias para compatibilidade
export function getTierColor(tierName) {
  const tier = TIER_COLORS_BY_LEVEL.find(t => t.name === tierName);
  return tier || TIER_COLORS_BY_LEVEL[0];
}

export function getNextTier(currentLevel) {
  const currentTier = getTierByLevel(currentLevel);
  const nextTierStart = currentTier.maxLevel + 1;
  if (nextTierStart > 100) return null;
  return getTierByLevel(nextTierStart);
}

// Exportar thresholds antigos para compatibilidade (não usar mais)
export const TIER_THRESHOLDS = TIER_COLORS_BY_LEVEL.map(t => ({
  name: t.name,
  min: getXPForLevel(t.minLevel),
  max: getXPForLevel(t.maxLevel + 1),
  icon: t.icon,
  emoji: t.icon
}));

export const TIER_COLORS = Object.fromEntries(
  TIER_COLORS_BY_LEVEL.map(t => [t.name, {
    primary: t.primary,
    gradient: t.gradient,
    glass_border: `border-${t.primary}/50`,
    text: t.text,
    bg: t.bg,
    orb1: t.orb1,
    orb2: t.orb2
  }])
);