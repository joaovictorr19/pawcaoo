import React from 'react';
import { Check } from 'lucide-react';

const VerifiedBadge = ({ className = "" }) => {
  return (
    <div className={`verified-badge-container relative flex items-center justify-center w-8 h-8 ${className}`} title="Conta Verificada Oficial">
      <style>
        {`
          @keyframes floatBadge {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
            100% { transform: translateY(0px); }
          }
          
          .verified-badge-3d {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            box-shadow: 
              0 4px 6px -1px rgba(37, 99, 235, 0.3),
              0 2px 4px -1px rgba(37, 99, 235, 0.15),
              inset 0 2px 4px rgba(255, 255, 255, 0.4),
              inset 0 -2px 4px rgba(0, 0, 0, 0.1);
            animation: floatBadge 3s ease-in-out infinite;
          }
          
          .verified-badge-shine {
            background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          }
        `}
      </style>
      
      {/* 3D Container */}
      <div className="verified-badge-3d w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden border border-blue-400/30">
        
        {/* Glossy Reflection */}
        <div className="verified-badge-shine absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" />
        
        {/* Checkmark */}
        <Check className="w-5 h-5 text-white drop-shadow-md z-10 stroke-[3px]" />
      </div>
    </div>
  );
};

export default VerifiedBadge;