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
    primary: 'orange-600',
    gradient: 'from-orange-400 to-orange-600',
    glass_border: 'border-orange-200/50',
    text: 'text-orange-600',
    bg: 'bg-orange-50',
    orb1: 'bg-orange-400',
    orb2: 'bg-amber-300',
    cssVars: {
      '--tier-primary': '#ea580c',
      '--tier-orb-1': '#fb923c',
      '--tier-orb-2': '#fbbf24'
    }
  },
  Prata: {
    primary: 'gray-400',
    gradient: 'from-gray-300 to-gray-500',
    glass_border: 'border-gray-200/50',
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    orb1: 'bg-gray-300',
    orb2: 'bg-slate-400',
    cssVars: {
      '--tier-primary': '#9ca3af',
      '--tier-orb-1': '#d1d5db',
      '--tier-orb-2': '#94a3b8'
    }
  },
  Ouro: {
    primary: 'yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    glass_border: 'border-yellow-200/50',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    orb1: 'bg-yellow-400',
    orb2: 'bg-amber-500',
    cssVars: {
      '--tier-primary': '#eab308',
      '--tier-orb-1': '#facc15',
      '--tier-orb-2': '#f59e0b'
    }
  },
  Safira: {
    primary: 'blue-600',
    gradient: 'from-blue-500 to-indigo-600',
    glass_border: 'border-blue-200/50',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    orb1: 'bg-blue-500',
    orb2: 'bg-indigo-500',
    cssVars: {
      '--tier-primary': '#2563eb',
      '--tier-orb-1': '#3b82f6',
      '--tier-orb-2': '#6366f1'
    }
  },
  Rubi: {
    primary: 'rose-600',
    gradient: 'from-red-600 via-pink-600 to-rose-700',
    glass_border: 'border-rose-200/50',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    orb1: 'bg-red-500',
    orb2: 'bg-pink-500',
    cssVars: {
      '--tier-primary': '#e11d48',
      '--tier-orb-1': '#ef4444',
      '--tier-orb-2': '#ec4899'
    }
  },
  Esmeralda: {
    primary: 'emerald-600',
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    glass_border: 'border-emerald-200/50',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    orb1: 'bg-emerald-500',
    orb2: 'bg-teal-500',
    cssVars: {
      '--tier-primary': '#059669',
      '--tier-orb-1': '#10b981',
      '--tier-orb-2': '#14b8a6'
    }
  },
  Diamante: {
    primary: 'cyan-400',
    gradient: 'from-cyan-300 via-blue-200 to-white',
    glass_border: 'border-white/80',
    text: 'text-cyan-500',
    bg: 'bg-cyan-50',
    orb1: 'bg-cyan-300',
    orb2: 'bg-blue-200',
    cssVars: {
      '--tier-primary': '#22d3ee',
      '--tier-orb-1': '#67e8f9',
      '--tier-orb-2': '#bfdbfe'
    }
  },
  Cosmos: {
    primary: 'violet-500',
    gradient: 'from-slate-900 via-purple-900 to-black',
    glass_border: 'border-purple-400/50',
    text: 'text-violet-400',
    bg: 'bg-slate-950',
    orb1: 'bg-purple-900',
    orb2: 'bg-slate-900',
    cssVars: {
      '--tier-primary': '#8b5cf6',
      '--tier-orb-1': '#581c87',
      '--tier-orb-2': '#0f172a'
    }
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