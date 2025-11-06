import React from "react";
import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";

export default function DogConnectLogo({ size = "default", showText = true, animated = true }) {
  const sizes = {
    small: {
      container: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-sm",
      sparkle: "w-2 h-2"
    },
    default: {
      container: "w-12 h-12",
      icon: "w-6 h-6",
      text: "text-xl",
      sparkle: "w-3 h-3"
    },
    large: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-3xl",
      sparkle: "w-4 h-4"
    },
    xlarge: {
      container: "w-24 h-24",
      icon: "w-12 h-12",
      text: "text-5xl",
      sparkle: "w-6 h-6"
    }
  };

  const currentSize = sizes[size];

  const LogoIcon = animated ? motion.div : 'div';
  const SparkleIcon = animated ? motion.div : 'div';
  
  const iconProps = animated ? {
    animate: {
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const sparkleProps = animated ? {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.8, 1, 0.8],
      rotate: [0, 180, 360]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <LogoIcon
          {...iconProps}
          className={`${currentSize.container} bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Users icon */}
          <Users className={`${currentSize.icon} text-white relative z-10 drop-shadow-lg`} />
          
          {/* Floating sparkle */}
          <SparkleIcon
            {...sparkleProps}
            className="absolute top-1 right-1 z-10"
          >
            <Sparkles className={`${currentSize.sparkle} text-white fill-white`} />
          </SparkleIcon>
          
          {/* Border ring */}
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/30 group-hover:ring-white/50 transition-all" />
        </LogoIcon>
      </div>

      {showText && (
        <div>
          <h2 className={`font-bold ${currentSize.text} leading-none tracking-tight`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Connect
            </span>
          </h2>
          {size !== "small" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight font-medium">
              Rede Social
            </p>
          )}
        </div>
      )}
    </div>
  );
}