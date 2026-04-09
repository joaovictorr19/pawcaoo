import React, { useMemo } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import LazyImageOptimized from '@/components/ui/LazyImageOptimized';
import ProfessionalCard from '@/components/marketplace/ProfessionalCard';

export default function OptimizedProfessionalsList({ professionals = [], onSelectProfessional }) {
  const { isMobile, reduceMotion } = useMobileOptimization();

  // Limitar quantidade em mobile
  const displayedProfessionals = useMemo(() => {
    return isMobile ? professionals.slice(0, 20) : professionals;
  }, [professionals, isMobile]);

  if (!displayedProfessionals.length) {
    return <div className="text-center py-8 text-gray-500">Nenhum profissional disponível</div>;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8"
      style={{
        willChange: isMobile ? 'auto' : 'transform',
        opacity: 1,
        transition: reduceMotion ? 'none' : 'opacity 0.3s ease-in-out'
      }}
    >
      {displayedProfessionals.map((walker) => (
        <div
          key={walker.id}
          onClick={() => onSelectProfessional(walker)}
          className="cursor-pointer transform hover:scale-105 transition-transform"
          style={{
            transitionDuration: reduceMotion ? '0s' : '0.2s',
            willChange: 'transform'
          }}
        >
          <ProfessionalCard walker={walker} />
        </div>
      ))}
    </div>
  );
}