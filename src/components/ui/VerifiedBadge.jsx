import React from 'react';
import { ShieldCheck, Award, Home as HomeIcon, Sparkles } from 'lucide-react';

const VerifiedBadge = ({ className = "", type = "walker", size = "md" }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5'
  };
  
  const badgeConfig = {
    walker: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        glow: 'rgba(59, 130, 246, 0.5)'
      },
      icon: ShieldCheck,
      title: 'Passeador Verificado'
    },
    trainer: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#6d28d9',
        glow: 'rgba(139, 92, 246, 0.5)'
      },
      icon: Award,
      title: 'Treinador Certificado'
    },
    shelter: {
      colors: {
        primary: '#10b981',
        secondary: '#047857',
        glow: 'rgba(16, 185, 129, 0.5)'
      },
      icon: HomeIcon,
      title: 'Abrigo Verificado'
    },
    partner: {
      colors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        glow: 'rgba(245, 158, 11, 0.5)'
      },
      icon: Sparkles,
      title: 'Parceiro Oficial'
    }
  };

  const config = badgeConfig[type] || badgeConfig.walker;
  const Icon = config.icon;
  const uniqueId = `verified-${type}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`verified-badge-premium relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`} title={config.title}>
      <style>
        {`
          .verified-badge-${uniqueId} {
            background: linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%);
            position: relative;
            border-radius: 50%;
            box-shadow: 
              0 0 0 2px rgba(255, 255, 255, 0.9),
              0 0 0 4px ${config.colors.primary}40,
              0 4px 12px ${config.colors.glow},
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2);
          }

          .verified-badge-${uniqueId}::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              ${config.colors.primary}00,
              ${config.colors.primary}80,
              ${config.colors.secondary}80,
              ${config.colors.primary}00
            );
            animation: verified-rotate-${uniqueId} 3s linear infinite;
            z-index: -1;
          }

          .verified-badge-${uniqueId}::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.5) 0%,
              rgba(255, 255, 255, 0) 50%,
              rgba(0, 0, 0, 0.1) 100%
            );
            pointer-events: none;
          }

          @keyframes verified-rotate-${uniqueId} {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .verified-icon-${uniqueId} {
            position: relative;
            z-index: 10;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            animation: verified-pulse-${uniqueId} 2s ease-in-out infinite;
          }

          @keyframes verified-pulse-${uniqueId} {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }

          .verified-sparkle-${uniqueId} {
            position: absolute;
            width: 3px;
            height: 3px;
            background: white;
            border-radius: 50%;
            opacity: 0;
            animation: verified-sparkle-${uniqueId} 2s ease-in-out infinite;
          }

          .verified-sparkle-${uniqueId}:nth-child(1) { top: 10%; left: 50%; animation-delay: 0s; }
          .verified-sparkle-${uniqueId}:nth-child(2) { top: 50%; right: 10%; animation-delay: 0.4s; }
          .verified-sparkle-${uniqueId}:nth-child(3) { bottom: 10%; left: 50%; animation-delay: 0.8s; }
          .verified-sparkle-${uniqueId}:nth-child(4) { top: 50%; left: 10%; animation-delay: 1.2s; }

          @keyframes verified-sparkle-${uniqueId} {
            0%, 100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      
      <div className={`verified-badge-${uniqueId} ${sizeClasses[size]} flex items-center justify-center`}>
        <Icon className={`verified-icon-${uniqueId} ${iconSizes[size]} text-white stroke-[2.5px]`} />
        
        {/* Sparkle effects */}
        <div className={`verified-sparkle-${uniqueId}`} />
        <div className={`verified-sparkle-${uniqueId}`} />
        <div className={`verified-sparkle-${uniqueId}`} />
        <div className={`verified-sparkle-${uniqueId}`} />
      </div>
    </div>
  );
};

export default VerifiedBadge;