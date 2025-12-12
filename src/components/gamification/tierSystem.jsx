// Tier System - Infinite Progression with Dynamic Colors

export const TIER_THRESHOLDS = [
  { name: 'Bronze', min: 0, max: 999, icon: '🛡️', emoji: '🥉' },
  { name: 'Prata', min: 1000, max: 2999, icon: '⚔️', emoji: '🥈' },
  { name: 'Ouro', min: 3000, max: 5999, icon: '👑', emoji: '🥇' },
  { name: 'Safira', min: 6000, max: 9999, icon: '💎', emoji: '💙' },
  { name: 'Rubi', min: 10000, max: 19999, icon: '🌹', emoji: '❤️' },
  { name: 'Esmeralda', min: 20000, max: 49999, icon: '🌿', emoji: '💚' },
  { name: 'Diamante', min: 50000, max: 99999, icon: '💠', emoji: '💎' },
  { name: 'Cosmos', min: 100000, max: Infinity, icon: '🌌', emoji: '🌟' }
];

export const TIER_COLORS = {
  Bronze: {
    primary: '#cd7f32',
    gradient: 'from-orange-400 to-orange-600',
    glass_border: 'border-orange-200/50',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    orb1: '#fb923c',
    orb2: '#fdba74'
  },
  Prata: {
    primary: '#c0c0c0',
    gradient: 'from-gray-300 to-gray-500',
    glass_border: 'border-gray-200/50',
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    orb1: '#94a3b8',
    orb2: '#cbd5e1'
  },
  Ouro: {
    primary: '#ffd700',
    gradient: 'from-yellow-400 to-yellow-600',
    glass_border: 'border-yellow-200/50',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    orb1: '#facc15',
    orb2: '#fef08a'
  },
  Safira: {
    primary: '#1d4ed8',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-700',
    glass_border: 'border-cyan-200/50',
    text: 'text-cyan-600',
    bg: 'bg-cyan-50',
    orb1: '#06b6d4',
    orb2: '#3b82f6'
  },
  Rubi: {
    primary: '#e0115f',
    gradient: 'from-red-600 via-pink-600 to-rose-700',
    glass_border: 'border-rose-200/50',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    orb1: '#f43f5e',
    orb2: '#fb7185'
  },
  Esmeralda: {
    primary: '#50c878',
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    glass_border: 'border-emerald-200/50',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    orb1: '#34d399',
    orb2: '#a7f3d0'
  },
  Diamante: {
    primary: '#b9f2ff',
    gradient: 'from-cyan-300 via-blue-200 to-white',
    glass_border: 'border-white/80',
    text: 'text-cyan-500',
    bg: 'bg-cyan-50',
    orb1: '#22d3ee',
    orb2: '#e0f2fe'
  },
  Cosmos: {
    primary: '#8b5cf6',
    gradient: 'from-slate-900 via-purple-900 to-black',
    glass_border: 'border-purple-400/50',
    text: 'text-violet-400',
    bg: 'bg-slate-950',
    orb1: '#4c1d95',
    orb2: '#2e1065'
  }
};

export function calculateTier(points) {
  const xp = Number(points) || 0;
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const tier = TIER_THRESHOLDS[i];
    if (xp >= tier.min) {
      return {
        ...tier,
        colors: TIER_COLORS[tier.name],
        progress: calculateProgress(xp, tier, TIER_THRESHOLDS[i + 1])
      };
    }
  }
  return {
    ...TIER_THRESHOLDS[0],
    colors: TIER_COLORS[TIER_THRESHOLDS[0].name],
    progress: 0
  };
}

function calculateProgress(currentXP, currentTier, nextTier) {
  if (!nextTier) return 100; // Max tier reached
  const rangeSize = nextTier.min - currentTier.min;
  const progress = currentXP - currentTier.min;
  return Math.min(100, (progress / rangeSize) * 100);
}

export function getTierColor(tierName) {
  return TIER_COLORS[tierName] || TIER_COLORS.Bronze;
}

export function getNextTier(currentTierName) {
  const currentIndex = TIER_THRESHOLDS.findIndex(t => t.name === currentTierName);
  return TIER_THRESHOLDS[currentIndex + 1] || null;
}

// XP Requirements for Levels (quadratic progression)
export function getXPForLevel(level) {
  return Math.floor(Math.pow(level, 2) * 100);
}

export function getLevelFromXP(xp) {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}