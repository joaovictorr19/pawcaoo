// ============================================
// TIER SYSTEM - ESPECTRO 100 NÍVEIS
// ============================================
// Sistema de cores profissional sem emojis
// Cores mudam a cada 10 níveis

// Função para obter cor baseada no nível (Espectro 0-100) - Tema Quente
export function getTierColor(level) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  
  if (safeLevel >= 100) return '#D97706'; // Lendário (dourado)
  if (safeLevel >= 90) return '#9A3412';  // Vulcão (laranja escuro)
  if (safeLevel >= 80) return '#991B1B';  // Rubi (vermelho escuro)
  if (safeLevel >= 70) return '#B8860B';  // Ouro
  if (safeLevel >= 60) return '#9CA3AF';  // Prata
  if (safeLevel >= 50) return '#1E3A8A';  // Oceano (azul escuro)
  if (safeLevel >= 40) return '#1E3A5F';  // Marinho
  if (safeLevel >= 30) return '#065F46';  // Esmeralda
  if (safeLevel >= 20) return '#166534';  // Floresta
  if (safeLevel >= 10) return '#92400E';  // Bronze
  return '#475569';                        // Chumbo
}

// Definição das 11 Cores do Espectro (a cada 10 níveis) - Tema Quente e Aconchegante
export const TIER_COLORS_BY_LEVEL = [
  // Níveis 0-9: Chumbo (Cinza escuro elegante)
  { minLevel: 0, maxLevel: 9, name: 'Chumbo', primary: '#475569', gradient: 'from-slate-600 via-slate-700 to-slate-800', orb1: '#64748B', orb2: '#475569', text: 'text-slate-400', bg: 'bg-slate-900', isDark: true },
  // Níveis 10-19: Bronze (Laranja escuro/cobre)
  { minLevel: 10, maxLevel: 19, name: 'Bronze', primary: '#92400E', gradient: 'from-amber-700 via-orange-800 to-amber-900', orb1: '#B45309', orb2: '#78350F', text: 'text-amber-400', bg: 'bg-amber-950', isDark: true },
  // Níveis 20-29: Floresta (Verde escuro profundo)
  { minLevel: 20, maxLevel: 29, name: 'Floresta', primary: '#166534', gradient: 'from-green-700 via-emerald-800 to-green-900', orb1: '#15803D', orb2: '#14532D', text: 'text-green-400', bg: 'bg-green-950', isDark: true },
  // Níveis 30-39: Esmeralda (Verde escuro rico)
  { minLevel: 30, maxLevel: 39, name: 'Esmeralda', primary: '#065F46', gradient: 'from-emerald-700 via-teal-800 to-emerald-900', orb1: '#047857', orb2: '#064E3B', text: 'text-emerald-400', bg: 'bg-emerald-950', isDark: true },
  // Níveis 40-49: Marinho (Azul marinho profundo)
  { minLevel: 40, maxLevel: 49, name: 'Marinho', primary: '#1E3A5F', gradient: 'from-blue-800 via-slate-800 to-blue-950', orb1: '#1E40AF', orb2: '#172554', text: 'text-blue-400', bg: 'bg-blue-950', isDark: true },
  // Níveis 50-59: Oceano (Azul escuro elegante)
  { minLevel: 50, maxLevel: 59, name: 'Oceano', primary: '#1E3A8A', gradient: 'from-blue-900 via-indigo-900 to-slate-900', orb1: '#1D4ED8', orb2: '#1E3A8A', text: 'text-blue-300', bg: 'bg-slate-900', isDark: true },
  // Níveis 60-69: Prata (Elegante metálico)
  { minLevel: 60, maxLevel: 69, name: 'Prata', primary: '#9CA3AF', gradient: 'from-gray-400 via-slate-500 to-gray-600', orb1: '#D1D5DB', orb2: '#9CA3AF', text: 'text-gray-300', bg: 'bg-gray-800', isDark: true },
  // Níveis 70-79: Ouro (Dourado rico e quente)
  { minLevel: 70, maxLevel: 79, name: 'Ouro', primary: '#B8860B', gradient: 'from-yellow-600 via-amber-600 to-yellow-700', orb1: '#EAB308', orb2: '#CA8A04', text: 'text-yellow-400', bg: 'bg-yellow-950', isDark: true },
  // Níveis 80-89: Rubi (Vermelho escuro profundo)
  { minLevel: 80, maxLevel: 89, name: 'Rubi', primary: '#991B1B', gradient: 'from-red-800 via-rose-900 to-red-950', orb1: '#DC2626', orb2: '#7F1D1D', text: 'text-red-400', bg: 'bg-red-950', isDark: true },
  // Níveis 90-99: Vulcão (Laranja/vermelho intenso)
  { minLevel: 90, maxLevel: 99, name: 'Vulcão', primary: '#9A3412', gradient: 'from-orange-800 via-red-800 to-orange-900', orb1: '#EA580C', orb2: '#7C2D12', text: 'text-orange-400', bg: 'bg-orange-950', isDark: true },
  // Nível 100+: Lendário (Gradiente especial dourado-âmbar)
  { minLevel: 100, maxLevel: 999, name: 'Lendário', primary: '#D97706', gradient: 'from-amber-500 via-yellow-600 to-orange-600', orb1: '#F59E0B', orb2: '#D97706', text: 'text-amber-300', bg: 'bg-gradient-to-br from-amber-950 to-orange-950', isDark: true, isLegendary: true }
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
// REGRA: Cada 100 XP = 1 Nível
// Exemplos: 0-99 XP = Nível 0, 100-199 XP = Nível 1, 150 XP = Nível 1
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