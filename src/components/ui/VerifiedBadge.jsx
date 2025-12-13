import React from 'react';
import { Check, GraduationCap, Dog } from 'lucide-react';

const VerifiedBadge = ({ className = "", type = "walker" }) => {
  // type: "walker", "trainer", "shelter", "partner"
  
  const badgeConfig = {
    walker: {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(37, 99, 235, 0.3)',
      border: 'border-blue-400/30',
      icon: Check,
      title: 'Passeador Verificado'
    },
    trainer: {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadow: 'rgba(139, 92, 246, 0.3)',
      border: 'border-purple-400/30',
      icon: GraduationCap,
      title: 'Treinador Certificado'
    },
    shelter: {
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.3)',
      border: 'border-green-400/30',
      icon: Dog,
      title: 'Abrigo Verificado'
    },
    partner: {
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: 'rgba(245, 158, 11, 0.3)',
      border: 'border-amber-400/30',
      icon: Check,
      title: 'Parceiro Oficial'
    }
  };

  const config = badgeConfig[type] || badgeConfig.walker;
  const Icon = config.icon;

  return (
    <div className={`verified-badge-container relative flex items-center justify-center w-6 h-6 ${className}`} title={config.title}>
      <style>
        {`
          .verified-badge-3d-${type} {
            background: ${config.gradient};
            box-shadow: 
              0 4px 6px -1px ${config.shadow},
              0 2px 4px -1px ${config.shadow.replace('0.3', '0.15')},
              inset 0 2px 4px rgba(255, 255, 255, 0.4),
              inset 0 -2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .verified-badge-shine {
            background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          }

          .verified-badge-pulse-${type} {
            animation: badgePulse-${type} 2s ease-in-out infinite;
          }

          @keyframes badgePulse-${type} {
            0%, 100% { 
              box-shadow: 
                0 4px 6px -1px ${config.shadow},
                0 2px 4px -1px ${config.shadow.replace('0.3', '0.15')},
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                inset 0 -2px 4px rgba(0, 0, 0, 0.1);
            }
            50% { 
              box-shadow: 
                0 6px 10px -1px ${config.shadow},
                0 4px 6px -1px ${config.shadow.replace('0.3', '0.25')},
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                inset 0 -2px 4px rgba(0, 0, 0, 0.1),
                0 0 20px ${config.shadow};
            }
          }
        `}
      </style>
      
      {/* 3D Container */}
      <div className={`verified-badge-3d-${type} verified-badge-pulse-${type} w-6 h-6 rounded-full flex items-center justify-center relative overflow-hidden ${config.border}`}>
        
        {/* Glossy Reflection */}
        <div className="verified-badge-shine absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" />
        
        {/* Icon */}
        <Icon className="w-3.5 h-3.5 text-white drop-shadow-md z-10 stroke-[3px]" />
      </div>
    </div>
  );
};

export default VerifiedBadge;