import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateTier } from './gamification/tierSystem';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
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
    colors: tierTheme.colors,
    icon: tierTheme.icon,
    progress: tierTheme.progress || 0,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};