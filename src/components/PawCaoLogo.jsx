import React from "react";
import { Dog } from "lucide-react";
import { motion } from "framer-motion";

export default function PawCaoLogo({ size = "default", showText = true, className = "", animated = false }) {
  // Validate size prop
  const validSize = ["small", "default", "large", "xlarge"].includes(size) ? size : "default";
  
  const sizes = {
    small: {
      container: "w-7 h-7 md:w-8 md:h-8",
      icon: "w-4 h-4 md:w-5 md:h-5",
      text: "text-xs md:text-sm",
      paw: "w-1.5 h-1.5 md:w-2 md:h-2",
      subtitle: "text-[8px] md:text-xs"
    },
    default: {
      container: "w-9 h-9 md:w-10 md:h-10",
      icon: "w-5 h-5 md:w-6 md:h-6",
      text: "text-base md:text-xl",
      paw: "w-2.5 h-2.5 md:w-3 md:h-3",
      subtitle: "text-[10px] md:text-xs"
    },
    large: {
      container: "w-12 h-12 md:w-16 md:h-16",
      icon: "w-7 h-7 md:w-10 md:h-10",
      text: "text-xl md:text-3xl",
      paw: "w-3 h-3 md:w-4 md:h-4",
      subtitle: "text-xs md:text-sm"
    },
    xlarge: {
      container: "w-16 h-16 md:w-24 md:h-24",
      icon: "w-10 h-10 md:w-16 md:h-16",
      text: "text-2xl md:text-5xl",
      paw: "w-4 h-4 md:w-6 md:h-6",
      subtitle: "text-sm md:text-base"
    }
  };

  const currentSize = sizes[validSize];

  const LogoIcon = animated ? motion.div : 'div';
  const iconProps = animated ? {
    animate: {
      rotate: [0, -5, 5, -5, 0],
      scale: [1, 1.05, 1, 1.05, 1]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatDelay: 2
    }
  } : {};

  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      <LogoIcon 
        {...iconProps}
        className={`${currentSize.container} bg-gradient-to-br from-green-500 via-green-600 to-blue-600 dark:from-green-400 dark:via-green-500 dark:to-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer flex-shrink-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <Dog className={`${currentSize.icon} text-white relative z-10 drop-shadow-lg`} />
        
        <div className="absolute bottom-0.5 md:bottom-1 right-0.5 md:right-1 opacity-40 group-hover:opacity-60 transition-opacity">
          <svg className={`${currentSize.paw} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 10.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm5-4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm10 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
          </svg>
        </div>
        
        <div className="absolute inset-0 rounded-xl md:rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
      </LogoIcon>

      {showText && (
        <div className="min-w-0">
          <h2 className={`font-bold ${currentSize.text} text-gray-900 dark:text-gray-100 leading-none tracking-tight truncate`}>
            Paw<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">Cão</span>
          </h2>
          {size !== "small" && (
            <p className={`${currentSize.subtitle} text-gray-500 dark:text-gray-400 leading-tight font-medium truncate`}>
              Dog Care Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
}