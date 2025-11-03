import React from "react";
import { Dog } from "lucide-react";

export default function PawCaoLogo({ size = "default", showText = true, className = "" }) {
  const sizes = {
    small: {
      container: "w-8 h-8",
      icon: "w-5 h-5",
      text: "text-sm"
    },
    default: {
      container: "w-10 h-10",
      icon: "w-6 h-6",
      text: "text-xl"
    },
    large: {
      container: "w-16 h-16",
      icon: "w-10 h-10",
      text: "text-3xl"
    },
    xlarge: {
      container: "w-24 h-24",
      icon: "w-16 h-16",
      text: "text-5xl"
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon with Paw Print */}
      <div className={`${currentSize.container} bg-gradient-to-br from-green-500 via-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group`}>
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Dog Icon */}
        <Dog className={`${currentSize.icon} text-white relative z-10`} />
        
        {/* Paw Print Accent */}
        <div className="absolute bottom-1 right-1 opacity-30">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 10.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm5-4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm10 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-10 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div>
          <h2 className={`font-bold ${currentSize.text} text-gray-900 leading-none`}>
            Paw<span className="text-green-600">Cão</span>
          </h2>
          {size !== "small" && (
            <p className="text-xs text-gray-500 leading-tight">Dog Care Platform</p>
          )}
        </div>
      )}
    </div>
  );
}