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
      return profiles[0] || null;
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

      // Define tier-specific orb colors
      const tierColors = {
        Bronze:   { orb1: '#fb923c', orb2: '#fdba74', primary: '#f97316' },
        Prata:    { orb1: '#94a3b8', orb2: '#cbd5e1', primary: '#64748b' },
        Ouro:     { orb1: '#facc15', orb2: '#fef08a', primary: '#eab308' },
        Safira:   { orb1: '#3b82f6', orb2: '#8b5cf6', primary: '#2563eb' },
        Rubi:     { orb1: '#f43f5e', orb2: '#fb7185', primary: '#e11d48' },
        Esmeralda: { orb1: '#34d399', orb2: '#a7f3d0', primary: '#10b981' },
        Diamante: { orb1: '#22d3ee', orb2: '#e0f2fe', primary: '#06b6d4' },
        Cosmos:   { orb1: '#4c1d95', orb2: '#2e1065', primary: '#8b5cf6' }
      };

      const colors = tierColors[tier.name] || tierColors.Bronze;
      
      // Set CSS variables for orbs
      document.documentElement.style.setProperty('--orb-1', colors.orb1);
      document.documentElement.style.setProperty('--orb-2', colors.orb2);
      document.documentElement.style.setProperty('--orb-primary', colors.primary);

      // Apply Cosmos dark mode
      if (tier.name === 'Cosmos') {
        document.documentElement.classList.add('dark-cosmos');
      } else {
        document.documentElement.classList.remove('dark-cosmos');
      }
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