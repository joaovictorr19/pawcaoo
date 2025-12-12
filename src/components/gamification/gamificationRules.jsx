/**
 * Gamification Rules & XP System
 * Exponential leveling to make progression harder
 */

// XP Required Per Level (Exponential Growth)
export const getXPForLevel = (level) => {
  // Bronze (1-5): 0-5000
  // Silver (6-10): 5000-15000  
  // Gold (11-20): 15000-50000
  // Sapphire (21-30): 50000-150000
  // Diamond (31-50): 150000-500000
  // Top (51+): 500000+
  
  if (level <= 1) return 0;
  if (level <= 5) return 500 * Math.pow(level, 1.5); // Bronze: ~500, 1500, 2600, 4000, 5500
  if (level <= 10) return 5000 + 1000 * Math.pow(level - 5, 2); // Silver
  if (level <= 20) return 15000 + 1500 * Math.pow(level - 10, 2.2); // Gold
  if (level <= 30) return 50000 + 3000 * Math.pow(level - 20, 2.5); // Sapphire
  if (level <= 50) return 150000 + 7000 * Math.pow(level - 30, 2.8); // Diamond
  return 500000 + 15000 * Math.pow(level - 50, 3); // Top (Legendary)
};

// Calculate level from XP
export const getLevelFromXP = (xp) => {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
};

// Calculate tier from points (INFINITE TIERS SYSTEM)
export const calculateTier = (points) => {
  const xp = Number(points) || 0;
  const tiers = [
    { name: 'Bronze', min: 0, max: 999, icon: '🛡️', gradient: 'from-orange-400 to-orange-600' },
    { name: 'Prata', min: 1000, max: 2999, icon: '⚔️', gradient: 'from-gray-300 to-gray-500' },
    { name: 'Ouro', min: 3000, max: 5999, icon: '👑', gradient: 'from-yellow-400 to-yellow-600' },
    { name: 'Safira', min: 6000, max: 9999, icon: '💎', gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Rubi', min: 10000, max: 19999, icon: '🌹', gradient: 'from-red-600 via-pink-600 to-rose-700' },
    { name: 'Esmeralda', min: 20000, max: 49999, icon: '🌿', gradient: 'from-emerald-500 via-green-500 to-teal-600' },
    { name: 'Diamante', min: 50000, max: 99999, icon: '💠', gradient: 'from-cyan-300 via-blue-200 to-white' },
    { name: 'Cosmos', min: 100000, max: Infinity, icon: '🌌', gradient: 'from-slate-900 via-purple-900 to-black' }
  ];
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].min) {
      const nextTier = tiers[i + 1];
      const progress = nextTier ? ((xp - tiers[i].min) / (nextTier.min - tiers[i].min)) * 100 : 100;
      return { ...tiers[i], progress };
    }
  }
  return { ...tiers[0], progress: 0 };
};

// Get tier name from level
export const getTierName = (level) => {
  const xp = getXPForLevel(level);
  const tier = calculateTier(xp);
  return `${tier.name} ${tier.icon}`;
};

// Get tier color from level
export const getTierColor = (level) => {
  const xp = getXPForLevel(level);
  const tier = calculateTier(xp);
  return tier.gradient || 'from-blue-500 to-indigo-600';
};

// XP Rewards
export const XP_REWARDS = {
  COMPLETE_BOOKING: 100,
  REVIEW_SUBMITTED: 50,
  REVIEW_RECEIVED: 25,
  REFERRAL_SUCCESS: 200,
  PROFILE_COMPLETE: 50,
  FIRST_POST: 30,
  DAILY_LOGIN: 10,
  ACHIEVEMENT_UNLOCK: 100,
};