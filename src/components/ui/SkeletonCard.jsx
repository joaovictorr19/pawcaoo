import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Foto / Topo */}
      <div className="mb-4 h-48 w-full rounded-lg bg-gray-200 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
      </div>
      
      {/* Título e Badges */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 w-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      
      {/* Linhas de Texto */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* Botão */}
      <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse mt-auto"></div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;