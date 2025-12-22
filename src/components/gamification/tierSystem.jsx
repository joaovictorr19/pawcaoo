// ============================================
// TIER SYSTEM - DARK MAGMA THEME
// ============================================
// Paleta "Escuro & Quente" com animações graduais
// Cores vibrantes de brasa, cobre, rubi, magma e ouro

// Função para obter cor baseada no nível (Espectro Dark Magma 0-100)
export function getTierColor(level) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  
  // Gradiente suave dentro de cada faixa
  if (safeLevel >= 100) return '#FFD700'; // Ouro Puro
  if (safeLevel >= 95) return '#F5C800';
  if (safeLevel >= 90) return '#DAA520'; // Dourado
  if (safeLevel >= 85) return '#CD9B1D';
  if (safeLevel >= 80) return '#B8860B'; // Dourado Escuro
  if (safeLevel >= 75) return '#FF7F00';
  if (safeLevel >= 70) return '#FF6B00';
  if (safeLevel >= 65) return '#FF5500';
  if (safeLevel >= 60) return '#FF4500'; // Laranja Vermelho
  if (safeLevel >= 55) return '#E63900';
  if (safeLevel >= 50) return '#DC143C'; // Carmesim
  if (safeLevel >= 45) return '#C41E3A';
  if (safeLevel >= 40) return '#8B0000'; // Vermelho Sangue
  if (safeLevel >= 35) return '#A52A2A';
  if (safeLevel >= 30) return '#B22222'; // Vermelho Fogo
  if (safeLevel >= 25) return '#BC4A3C';
  if (safeLevel >= 20) return '#CD5C5C'; // Castanho Indiano
  if (safeLevel >= 15) return '#A0522D';
  if (safeLevel >= 10) return '#8B4513'; // Bronze Escuro
  if (safeLevel >= 5) return '#6B3A0A';
  return '#5C3317';  // Brasa Inicial
}

// Definição das 5 Faixas do Espectro Dark Magma
export const TIER_COLORS_BY_LEVEL = [
  // Níveis 0-19: Brasa Inicial (Bronze Escuro → Siena Queimado)
  { 
    minLevel: 0, 
    maxLevel: 19, 
    name: 'Brasa', 
    primary: '#8B4513', 
    gradient: 'from-amber-900 to-orange-800', 
    orb1: '#8B4513', 
    orb2: '#A0522D', 
    text: 'text-amber-800', 
    bg: 'bg-amber-950/20',
    animationClass: 'animate-ember-subtle',
    glowIntensity: 'low'
  },
  // Níveis 20-39: Cobre Aquecido (Castanho Indiano → Vermelho Fogo Tijolo)
  { 
    minLevel: 20, 
    maxLevel: 39, 
    name: 'Cobre', 
    primary: '#CD5C5C', 
    gradient: 'from-red-800 to-orange-700', 
    orb1: '#CD5C5C', 
    orb2: '#B22222', 
    text: 'text-red-700', 
    bg: 'bg-red-950/20',
    animationClass: 'animate-ember-subtle',
    glowIntensity: 'low'
  },
  // Níveis 40-59: Rubi Intenso (Vermelho Sangue → Carmesim)
  { 
    minLevel: 40, 
    maxLevel: 59, 
    name: 'Rubi', 
    primary: '#DC143C', 
    gradient: 'from-red-700 to-rose-600', 
    orb1: '#8B0000', 
    orb2: '#DC143C', 
    text: 'text-red-600', 
    bg: 'bg-red-900/20',
    animationClass: 'animate-ember-medium',
    glowIntensity: 'medium'
  },
  // Níveis 60-79: Magma (Laranja Vermelho → Laranja Escuro)
  { 
    minLevel: 60, 
    maxLevel: 79, 
    name: 'Magma', 
    primary: '#FF4500', 
    gradient: 'from-orange-600 to-red-500', 
    orb1: '#FF4500', 
    orb2: '#FF8C00', 
    text: 'text-orange-500', 
    bg: 'bg-orange-900/20',
    animationClass: 'animate-ember-medium',
    glowIntensity: 'medium'
  },
  // Níveis 80-99: Ouro Fundido (Dourado Escuro → Ouro)
  { 
    minLevel: 80, 
    maxLevel: 99, 
    name: 'Ouro Fundido', 
    primary: '#DAA520', 
    gradient: 'from-yellow-500 to-amber-500', 
    orb1: '#B8860B', 
    orb2: '#FFD700', 
    text: 'text-yellow-500', 
    bg: 'bg-yellow-900/20',
    animationClass: 'animate-ember-intense',
    glowIntensity: 'high'
  },
  // Nível 100: Ouro Supremo (Lendário)
  { 
    minLevel: 100, 
    maxLevel: 999, 
    name: 'Supremo', 
    primary: '#FFD700', 
    gradient: 'from-yellow-400 via-amber-400 to-yellow-300', 
    orb1: '#FFD700', 
    orb2: '#FFA500', 
    text: 'text-yellow-400', 
    bg: 'bg-gradient-to-br from-yellow-900/30 to-amber-900/30', 
    isLegendary: true,
    animationClass: 'animate-legendary-fire',
    glowIntensity: 'legendary'
  }
];

// ============================================
// SISTEMA LINEAR: 100 XP = 1 NÍVEL
// ============================================

export function getXPForLevel(level) {
  if (level <= 0) return 0;
  return level * 100;
}

export function getLevelFromXP(xp) {
  if (!xp || xp <= 0) return 0;
  const level = Math.floor(xp / 100);
  return Math.min(100, level);
}

export function getLevelProgress(xp) {
  if (!xp || xp <= 0) return 0;
  return xp % 100;
}

export function getXPToNextLevel(xp) {
  if (!xp || xp <= 0) return 100;
  const currentLevel = getLevelFromXP(xp);
  if (currentLevel >= 100) return 0;
  return 100 - (xp % 100);
}

export function getTierByLevel(level) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  for (const tier of TIER_COLORS_BY_LEVEL) {
    if (safeLevel >= tier.minLevel && safeLevel <= tier.maxLevel) {
      return { ...tier };
    }
  }
  return TIER_COLORS_BY_LEVEL[0];
}

// ============================================
// SISTEMA DE ANIMAÇÕES GRADUAIS
// ============================================

export function getAnimationClass(level) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  
  if (safeLevel >= 100) return 'animate-legendary-fire';
  if (safeLevel >= 80) return 'animate-ember-intense';
  if (safeLevel >= 40) return 'animate-ember-medium';
  return 'animate-ember-subtle';
}

export function getGlowStyle(level, color) {
  const safeLevel = Math.min(100, Math.max(0, level || 0));
  
  if (safeLevel >= 100) {
    // Lendário: Faíscas douradas intensas
    return {
      boxShadow: `0 0 30px ${color}, 0 0 60px ${color}80, 0 0 90px ${color}40, 0 0 120px ${color}20`,
      filter: 'brightness(1.2)',
    };
  }
  if (safeLevel >= 80) {
    // Intenso: Brilho forte
    return {
      boxShadow: `0 0 20px ${color}90, 0 0 40px ${color}50, 0 0 60px ${color}30`,
    };
  }
  if (safeLevel >= 40) {
    // Médio: Brasa moderada
    return {
      boxShadow: `0 0 12px ${color}70, 0 0 24px ${color}30`,
    };
  }
  // Subtil: Pulsação leve
  return {
    boxShadow: `0 0 8px ${color}40, 0 0 16px ${color}20`,
  };
}

// Função principal: calcular tudo a partir de XP
export function calculateTier(xp) {
  const safeXP = Number(xp) || 0;
  const level = getLevelFromXP(safeXP);
  const tier = getTierByLevel(level);
  const color = getTierColor(level);
  
  const progress = getLevelProgress(safeXP);
  const xpToNextLevel = getXPToNextLevel(safeXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const animationClass = getAnimationClass(level);
  const glowStyle = getGlowStyle(level, color);

  return {
    level,
    name: tier.name,
    color,
    primary: tier.primary,
    gradient: tier.gradient,
    orb1: tier.orb1,
    orb2: tier.orb2,
    text: tier.text,
    bg: tier.bg,
    isDark: true, // Tema Dark Magma é sempre escuro
    isLegendary: tier.isLegendary || false,
    min: currentLevelXP,
    max: nextLevelXP,
    progress,
    xpToNextLevel,
    tierRange: `${tier.minLevel}-${tier.maxLevel}`,
    animationClass,
    glowStyle,
    glowIntensity: tier.glowIntensity,
    colors: {
      primary: tier.primary,
      gradient: tier.gradient,
      orb1: tier.orb1,
      orb2: tier.orb2
    }
  };
}

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

// CSS Animations para injetar no globals.css
export const MAGMA_ANIMATIONS_CSS = `
/* ============================================
   DARK MAGMA ANIMATIONS - Ember System
   ============================================ */

/* Nível 0-39: Pulsação Subtil - Brasa dormindo */
@keyframes ember-subtle {
  0%, 100% { 
    opacity: 1;
    filter: brightness(1);
  }
  50% { 
    opacity: 0.92;
    filter: brightness(1.05);
  }
}

.animate-ember-subtle {
  animation: ember-subtle 4s ease-in-out infinite;
}

/* Nível 40-79: Brasa Média - Irradiando calor */
@keyframes ember-medium {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 8px currentColor);
  }
  50% { 
    transform: scale(1.02);
    filter: brightness(1.1) drop-shadow(0 0 16px currentColor);
  }
}

.animate-ember-medium {
  animation: ember-medium 2.5s ease-in-out infinite;
}

/* Nível 80-99: Brasa Intensa - Ondas de calor */
@keyframes ember-intense {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1.1) drop-shadow(0 0 12px currentColor);
  }
  25% { 
    transform: scale(1.03);
    filter: brightness(1.2) drop-shadow(0 0 20px currentColor);
  }
  50% { 
    transform: scale(1.01);
    filter: brightness(1.15) drop-shadow(0 0 16px currentColor);
  }
  75% { 
    transform: scale(1.04);
    filter: brightness(1.25) drop-shadow(0 0 24px currentColor);
  }
}

.animate-ember-intense {
  animation: ember-intense 2s ease-in-out infinite;
}

/* Nível 100: Lendário - Fogo vivo com faíscas */
@keyframes legendary-fire {
  0% { 
    transform: scale(1) rotate(0deg);
    filter: brightness(1.2) drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FFA500);
  }
  25% { 
    transform: scale(1.05) rotate(1deg);
    filter: brightness(1.4) drop-shadow(0 0 30px #FFD700) drop-shadow(0 0 60px #FF8C00);
  }
  50% { 
    transform: scale(1.02) rotate(-1deg);
    filter: brightness(1.3) drop-shadow(0 0 25px #FFD700) drop-shadow(0 0 50px #FFA500);
  }
  75% { 
    transform: scale(1.06) rotate(0.5deg);
    filter: brightness(1.5) drop-shadow(0 0 35px #FFD700) drop-shadow(0 0 70px #FF6B00);
  }
  100% { 
    transform: scale(1) rotate(0deg);
    filter: brightness(1.2) drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FFA500);
  }
}

.animate-legendary-fire {
  animation: legendary-fire 1.5s ease-in-out infinite;
}

/* Shimmer effect for legendary items */
@keyframes golden-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.animate-golden-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent);
  background-size: 200% 100%;
  animation: golden-shimmer 3s linear infinite;
}

/* Spark particles for legendary */
@keyframes spark {
  0% { 
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% { 
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
  100% { 
    opacity: 0;
    transform: translateY(-20px) scale(0);
  }
}

.animate-spark {
  animation: spark 1s ease-out infinite;
}
`;

// Exportar thresholds para compatibilidade
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