import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { calculateTier } from '@/components/gamification/tierSystem';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [prefersDark, setPrefersDark] = React.useState(false);

  // Detect system dark mode preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersDark(e.matches);
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

  const xp = userProfile?.gamification_xp ?? user?.gamification_xp ?? 0;
  const tierInfo = calculateTier(xp);
  const { level } = tierInfo;

  const getThemeColors = (tierName) => {
    const themeMap = {
      'Lendário':  { name: 'gold', primary: 'bg-yellow-600', secondary: 'bg-yellow-50', text: 'text-yellow-900', accent: 'text-yellow-600', border: 'border-yellow-200', ring: 'ring-yellow-500', gradient: 'from-yellow-600 via-amber-500 to-yellow-400' },
      'Vulcão':    { name: 'gold', primary: 'bg-yellow-600', secondary: 'bg-yellow-50', text: 'text-yellow-900', accent: 'text-yellow-600', border: 'border-yellow-200', ring: 'ring-yellow-500', gradient: 'from-yellow-600 via-amber-500 to-yellow-400' },
      'Rubi':      { name: 'wine', primary: 'bg-rose-950', secondary: 'bg-rose-50', text: 'text-rose-950', accent: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-500', gradient: 'from-rose-950 to-red-900' },
      'Ouro':      { name: 'amber', primary: 'bg-amber-900', secondary: 'bg-amber-50', text: 'text-amber-900', accent: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-500', gradient: 'from-amber-900 to-yellow-700' },
      'Prata':     { name: 'wine', primary: 'bg-rose-950', secondary: 'bg-rose-50', text: 'text-rose-950', accent: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-500', gradient: 'from-rose-950 to-red-900' },
      'Oceano':    { name: 'navy', primary: 'bg-blue-950', secondary: 'bg-blue-50', text: 'text-blue-950', accent: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500', gradient: 'from-blue-950 to-indigo-900' },
      'Marinho':   { name: 'navy', primary: 'bg-blue-950', secondary: 'bg-blue-50', text: 'text-blue-950', accent: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500', gradient: 'from-blue-950 to-indigo-900' },
      'Esmeralda': { name: 'amber', primary: 'bg-amber-900', secondary: 'bg-amber-50', text: 'text-amber-900', accent: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-500', gradient: 'from-amber-900 to-yellow-700' },
      'Floresta':  { name: 'forest', primary: 'bg-emerald-900', secondary: 'bg-emerald-100', text: 'text-emerald-900', accent: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500', gradient: 'from-emerald-900 to-green-800' },
      'Bronze':    { name: 'navy', primary: 'bg-blue-950', secondary: 'bg-blue-50', text: 'text-blue-950', accent: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500', gradient: 'from-blue-950 to-indigo-900' },
      'Chumbo':    { name: 'forest', primary: 'bg-emerald-900', secondary: 'bg-emerald-100', text: 'text-emerald-900', accent: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500', gradient: 'from-emerald-900 to-green-800' },
    };
    
    return themeMap[tierName] || themeMap['Chumbo'];
  };

  const colors = getThemeColors(tierInfo.name);

  return (
    <ThemeContext.Provider value={{ colors, level, xp, prefersDark }}>
      {children}
    </ThemeContext.Provider>
  );
};