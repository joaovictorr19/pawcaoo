import React from 'react';
import { motion } from 'framer-motion';

// Detecta preferência do sistema e ajusta animações
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = React.useState(() => 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 768
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduceMotion;
}

// Wrapper para framer-motion com redução automática
export function AnimatedDiv({ children, reduceMotion, ...motionProps }) {
  if (reduceMotion) {
    return <div>{children}</div>;
  }
  return <motion.div {...motionProps}>{children}</motion.div>;
}

// Transições leves para mobile
export const mobileTransitions = {
  light: { duration: 0.15, ease: 'easeInOut' },
  standard: { duration: 0.2, ease: 'easeInOut' },
  heavy: { duration: 0.3, ease: 'easeInOut' }
};