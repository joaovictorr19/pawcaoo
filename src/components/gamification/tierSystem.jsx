// ============================================
// TIER SYSTEM - ESPECTRO 100 NÍVEIS
// ============================================
// Sistema de cores profissional sem emojis
// Cores mudam a cada 10 níveis

// Função para obter cor baseada no nível (Espectro 0-100)
export function getTierColor(level) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  
  if (safeLevel >= 100) return '#8B5CF6'; // Diamante (gradiente especial)
  if (safeLevel >= 90) return '#EF4444';  // Vermelho Fogo
  if (safeLevel >= 80) return '#EC4899';  // Rosa Choque
  if (safeLevel >= 70) return '#8B5CF6';  // Roxo
  if (safeLevel >= 60) return '#6366F1';  // Índigo
  if (safeLevel >= 50) return '#3B82F6';  // Azul Real
  if (safeLevel >= 40) return '#06B6D4';  // Ciano
  if (safeLevel >= 30) return '#10B981';  // Verde Esmeralda
  if (safeLevel >= 20) return '#84CC16';  // Verde Lima
  if (safeLevel >= 10) return '#D97706';  // Bronze
  return '#94A3B8';                        // Cinza Chumbo
}

// Definição das 11 Cores do Espectro (a cada 10 níveis)
export const TIER_COLORS_BY_LEVEL = [
  // Níveis 0-9: Cinza Chumbo
  { minLevel: 0, maxLevel: 9, name: 'Chumbo', primary: '#94A3B8', gradient: 'from-slate-400 to-slate-600', orb1: '#94A3B8', orb2: '#CBD5E1', text: 'text-slate-500', bg: 'bg-slate-100' },
  // Níveis 10-19: Bronze
  { minLevel: 10, maxLevel: 19, name: 'Bronze', primary: '#D97706', gradient: 'from-amber-500 to-orange-600', orb1: '#D97706', orb2: '#F59E0B', text: 'text-amber-600', bg: 'bg-amber-50' },
  // Níveis 20-29: Verde Lima
  { minLevel: 20, maxLevel: 29, name: 'Lima', primary: '#84CC16', gradient: 'from-lime-400 to-green-500', orb1: '#84CC16', orb2: '#A3E635', text: 'text-lime-600', bg: 'bg-lime-50' },
  // Níveis 30-39: Verde Esmeralda
  { minLevel: 30, maxLevel: 39, name: 'Esmeralda', primary: '#10B981', gradient: 'from-emerald-400 to-green-600', orb1: '#10B981', orb2: '#34D399', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  // Níveis 40-49: Ciano
  { minLevel: 40, maxLevel: 49, name: 'Ciano', primary: '#06B6D4', gradient: 'from-cyan-400 to-teal-500', orb1: '#06B6D4', orb2: '#22D3EE', text: 'text-cyan-600', bg: 'bg-cyan-50' },
  // Níveis 50-59: Azul Real
  { minLevel: 50, maxLevel: 59, name: 'Azul Real', primary: '#3B82F6', gradient: 'from-blue-500 to-blue-700', orb1: '#3B82F6', orb2: '#60A5FA', text: 'text-blue-600', bg: 'bg-blue-50' },
  // Níveis 60-69: Índigo
  { minLevel: 60, maxLevel: 69, name: 'Índigo', primary: '#6366F1', gradient: 'from-indigo-500 to-violet-600', orb1: '#6366F1', orb2: '#818CF8', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  // Níveis 70-79: Roxo
  { minLevel: 70, maxLevel: 79, name: 'Roxo', primary: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', orb1: '#8B5CF6', orb2: '#A78BFA', text: 'text-violet-600', bg: 'bg-violet-50' },
  // Níveis 80-89: Rosa Choque
  { minLevel: 80, maxLevel: 89, name: 'Rosa', primary: '#EC4899', gradient: 'from-pink-500 to-rose-600', orb1: '#EC4899', orb2: '#F472B6', text: 'text-pink-600', bg: 'bg-pink-50' },
  // Níveis 90-99: Vermelho Fogo
  { minLevel: 90, maxLevel: 99, name: 'Fogo', primary: '#EF4444', gradient: 'from-red-500 to-orange-600', orb1: '#EF4444', orb2: '#F87171', text: 'text-red-600', bg: 'bg-red-50' },
  // Nível 100+: Diamante (Gradiente cyan para purple)
  { minLevel: 100, maxLevel: 999, name: 'Diamante', primary: '#8B5CF6', gradient: 'from-cyan-400 via-blue-500 to-purple-600', orb1: '#06B6D4', orb2: '#8B5CF6', text: 'text-purple-600', bg: 'bg-gradient-to-br from-cyan-50 to-purple-50', isLegendary: true }
];

// ============================================
// SISTEMA LINEAR: 100 XP = 1 NÍVEL
// ============================================
// Nível 0 = 0 XP, Nível 50 = 5000 XP, Nível 100 = 10000 XP

// XP necessário para atingir um nível (linear)
export function getXPForLevel(level) {
  if (level <= 0) return 0;
  return level * 100;
}

// Calcular nível a partir de XP (linear: floor(xp / 100))
export function getLevelFromXP(xp) {
  if (!xp || xp <= 0) return 0;
  const level = Math.floor(xp / 100);
  return Math.min(100, level); // Cap at level 100
}

// Progresso dentro do nível atual (0-100)
export function getLevelProgress(xp) {
  if (!xp || xp <= 0) return 0;
  return xp % 100; // Resto é o progresso para próximo nível
}

// XP restante para próximo nível
export function getXPToNextLevel(xp) {
  if (!xp || xp <= 0) return 100;
  const currentLevel = getLevelFromXP(xp);
  if (currentLevel >= 100) return 0;
  return 100 - (xp % 100);
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
  const color = getTierColor(level);
  
  // SISTEMA LINEAR: progresso = xp % 100
  const progress = getLevelProgress(safeXP); // 0-100 (XP dentro do nível)
  const xpToNextLevel = getXPToNextLevel(safeXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);

  return {
    level,
    name: tier.name,
    color, // Cor hex direta do espectro
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
    progress, // 0-100 (XP dentro do nível atual)
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

// Alias para compatibilidade (por nome)
export function getTierColorByName(tierName) {
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