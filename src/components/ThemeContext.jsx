import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateTier } from './gamification/tierSystem';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme instead of throwing error
    return {
      tier: 'Safira',
      colors: {
        primary: 'blue-600',
        gradient: 'from-blue-500 to-indigo-600',
        glass_border: 'border-blue-200/50',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        isDarkMode: false
      },
      icon: '💎',
      progress: 0,
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [tierTheme, setTierTheme] = useState({
    name: 'Safira',
    colors: {
      primary: 'blue-600',
      gradient: 'from-blue-500 to-indigo-600',
      glass_border: 'border-blue-200/50',
      text: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profile = profiles[0] || null;
      
      // Sync XP from User if UserProfile XP is lower
      if (profile && user) {
        const profileXP = profile.gamification_xp || 0;
        const userXP = user.gamification_xp || 0;
        const correctXP = Math.max(profileXP, userXP);
        
        if (correctXP !== profileXP && correctXP > 0) {
          try {
            await base44.entities.UserProfile.update(profile.id, { gamification_xp: correctXP });
            profile.gamification_xp = correctXP;
          } catch (e) {
            console.error('Failed to sync XP to UserProfile:', e);
          }
        }
      }
      
      return profile;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (userProfile) {
      const xp = userProfile.gamification_xp || 0;
      const tier = calculateTier(xp);
      setTierTheme({
        name: tier.name,
        colors: tier.colors,
        icon: tier.icon,
        progress: tier.progress
      });

      // Inject CSS Variables into :root for dynamic orbs
      const root = document.documentElement;
      root.style.setProperty('--color-orb-1', tier.colors.orb1 || tier.colors.primary);
      root.style.setProperty('--color-orb-2', tier.colors.orb2 || tier.colors.primary);
      root.style.setProperty('--color-primary', tier.colors.primary);

      // Apply Cosmos dark mode
      if (tier.name === 'Cosmos') {
        document.documentElement.classList.add('dark-cosmos');
      } else {
        document.documentElement.classList.remove('dark-cosmos');
      }

      console.log(`🎨 Tema ${tier.name} aplicado | XP: ${xp} | Cores: ${tier.colors.orb1 || tier.colors.primary}, ${tier.colors.orb2 || tier.colors.primary}`);
    }
  }, [userProfile]);

  const value = {
    tier: tierTheme.name,
    colors: {
      ...tierTheme.colors,
      isDarkMode: tierTheme.name === 'Cosmos'
    },
    icon: tierTheme.icon,
    progress: tierTheme.progress || 0,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};