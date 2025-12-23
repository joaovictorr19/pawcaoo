import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 1. Buscar o Nível do Utilizador do UserProfile (fonte única da verdade)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfileTheme', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 10 * 1000,
  });

  const level = userProfile?.gamification_level || 0;

  // 2. A Lógica das Cores (Jewel Tones / Tons de Joia)
  const getThemeByLevel = (lvl) => {
    // TIER 1 (0-19): VERDE FLORESTA (Deep Forest)
    if (lvl < 20) return {
      name: 'forest',
      primary: 'bg-emerald-900',      // Botões e Fundos Escuros
      secondary: 'bg-emerald-100',    // Fundos Claros
      text: 'text-emerald-900',       // Títulos
      accent: 'text-emerald-600',     // Ícones e Links
      border: 'border-emerald-200',   // Bordas finas
      ring: 'ring-emerald-500',       // Foco
      gradient: 'from-emerald-900 to-green-800' // Gradientes
    };

    // TIER 2 (20-39): AZUL MARINHO REAL (Navy Blue)
    if (lvl < 40) return {
      name: 'navy',
      primary: 'bg-blue-950',
      secondary: 'bg-blue-50',
      text: 'text-blue-950',
      accent: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'ring-blue-500',
      gradient: 'from-blue-950 to-indigo-900'
    };

    // TIER 3 (40-59): VERMELHO VINHO (Bordeaux/Velvet)
    if (lvl < 60) return {
      name: 'wine',
      primary: 'bg-rose-950',         // Quase preto avermelhado
      secondary: 'bg-rose-50',
      text: 'text-rose-950',
      accent: 'text-rose-700',
      border: 'border-rose-200',
      ring: 'ring-rose-500',
      gradient: 'from-rose-950 to-red-900'
    };

    // TIER 4 (60-79): ÂMBAR ESCURO (Dark Amber)
    if (lvl < 80) return {
      name: 'amber',
      primary: 'bg-amber-900',
      secondary: 'bg-amber-50',
      text: 'text-amber-900',
      accent: 'text-amber-600',
      border: 'border-amber-200',
      ring: 'ring-amber-500',
      gradient: 'from-amber-900 to-yellow-700'
    };

    // TIER 5 (80+): LENDA DOURADA (Gold)
    return {
      name: 'gold',
      primary: 'bg-yellow-600',
      secondary: 'bg-yellow-50',
      text: 'text-yellow-900',
      accent: 'text-yellow-600',
      border: 'border-yellow-200',
      ring: 'ring-yellow-500',
      gradient: 'from-yellow-600 via-amber-500 to-yellow-400' // Este brilha mais
    };
  };

  const colors = getThemeByLevel(level);

  return (
    <ThemeContext.Provider value={{ colors, level }}>
      {children}
    </ThemeContext.Provider>
  );
};