import React from "react";
import { Dog } from "lucide-react";
import { motion } from "framer-motion";

export default function PawCaoLogo({ size = "default", showText = true, className = "", animated = false }) {
  const sizes = {
    small: {
      container: "w-8 h-8",
      icon: "w-5 h-5",
      text: "text-sm",
      paw: "w-2 h-2"
    },
    default: {
      container: "w-10 h-10",
      icon: "w-6 h-6",
      text: "text-xl",
      paw: "w-3 h-3"
    },
    large: {
      container: "w-16 h-16",
      icon: "w-10 h-10",
      text: "text-3xl",
      paw: "w-4 h-4"
    },
    xlarge: {
      container: "w-24 h-24",
      icon: "w-16 h-16",
      text: "text-5xl",
      paw: "w-6 h-6"
    }
  };

  const currentSize = sizes[size];

  const LogoIcon = animated ? motion.div : 'div';
  const iconProps = animated ? {
    animate: {
      scale: [1, 1.05, 1, 1.05, 1]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatDelay: 2
    }
  } : {};

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon 
        {...iconProps}
        className={`${currentSize.container} bg-gradient-to-br from-green-500 via-green-600 to-blue-600 dark:from-green-400 dark:via-green-500 dark:to-blue-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <Dog className={`${currentSize.icon} text-white relative z-10 drop-shadow-lg`} />
        
        <div className="absolute bottom-1 right-1 opacity-40 group-hover:opacity-60 transition-opacity">
          <svg className={`${currentSize.paw} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 10.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm5-4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm10 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
          </svg>
        </div>
        
        <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
      </LogoIcon>

      {showText && (
        <div>
          <h2 className={`font-bold ${currentSize.text} text-gray-900 dark:text-gray-100 leading-none tracking-tight`}>
            Paw<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">Cão</span>
          </h2>
          {size !== "small" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight font-medium">
              Dog Care Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
}