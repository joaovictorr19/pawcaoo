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
      
      // Novo sistema de 100 níveis com 20 cores
      setTierTheme({
        name: tier.name,
        level: tier.level,
        colors: {
          primary: tier.primary,
          gradient: tier.gradient,
          orb1: tier.orb1,
          orb2: tier.orb2,
          text: tier.text,
          bg: tier.bg,
          isDark: tier.isDark,
          isLegendary: tier.isLegendary
        },
        icon: tier.icon,
        progress: tier.progress
      });

      // Inject CSS Variables into :root for dynamic orbs
      const root = document.documentElement;
      root.style.setProperty('--color-orb-1', tier.orb1 || tier.primary);
      root.style.setProperty('--color-orb-2', tier.orb2 || tier.primary);
      root.style.setProperty('--color-primary', tier.primary);

      // Apply dark mode for dark tiers (Obsidiana, Cosmos)
      if (tier.isDark) {
        document.documentElement.classList.add('dark-cosmos');
      } else {
        document.documentElement.classList.remove('dark-cosmos');
      }

      console.log(`🎨 Tema ${tier.name} (Nv.${tier.level}) aplicado | XP: ${xp} | Cores: ${tier.orb1}, ${tier.orb2}`);
    }
  }, [userProfile]);

  const value = {
    tier: tierTheme.name,
    level: tierTheme.level || 1,
    colors: {
      ...tierTheme.colors,
      isDarkMode: tierTheme.colors?.isDark || tierTheme.name === 'Cosmos' || tierTheme.name === 'Obsidiana'
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