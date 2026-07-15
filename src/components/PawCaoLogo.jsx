import React from "react";
import { motion } from "framer-motion";

const PAWCAO_LOGO_URL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/8d6fc422b_37581B35-5C27-4772-B599-CF9FD84219083.jpg";

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
        className={`${currentSize.container} rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group cursor-pointer flex-shrink-0 ring-1 ring-black/5`}
      >
        <img
          src={PAWCAO_LOGO_URL}
          alt="PawCão"
          className="w-full h-full object-cover relative z-10"
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20 pointer-events-none" />
        
        <div className="absolute inset-0 rounded-xl md:rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all z-20 pointer-events-none" />
      </LogoIcon>

      {showText && (
        <div className="min-w-0">
          <h2 className={`font-heading font-extrabold ${currentSize.text} text-slate-900 leading-none tracking-tight truncate`}>
            Paw<span className="text-[#1D8A82]">Cão</span>
          </h2>
          {size !== "small" && (
            <p className={`${currentSize.subtitle} text-slate-400 leading-tight font-semibold truncate`}>
              Dog Care Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
}