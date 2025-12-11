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

// Get tier name
export const getTierName = (level) => {
  if (level <= 5) return 'Bronze';
  if (level <= 10) return 'Silver';
  if (level <= 20) return 'Gold';
  if (level <= 30) return 'Sapphire';
  if (level <= 50) return 'Diamond';
  return 'Top';
};

// Get tier color
export const getTierColor = (level) => {
  if (level <= 5) return 'from-orange-700 to-orange-500';
  if (level <= 10) return 'from-gray-400 to-gray-300';
  if (level <= 20) return 'from-yellow-500 to-yellow-300';
  if (level <= 30) return 'from-blue-600 to-cyan-400';
  if (level <= 50) return 'from-purple-600 to-pink-400';
  return 'from-red-600 via-yellow-500 to-purple-600';
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