import React from 'react';
import { motion } from "framer-motion";

export function AdminCitySwitcher({ activeCity, onCityChange }) {
  const cities = [
    { id: 'porto', name: 'Porto', icon: '🍷' },
    { id: 'lisboa', name: 'Lisboa', icon: '🚋' },
    { id: 'all', name: 'Portugal', icon: '🇵🇹' }
  ];

  return (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-[2rem] border border-slate-200/50">
      {cities.map((city) => {
        const isActive = activeCity === city.id;
        return (
          <motion.button
            key={city.id}
            onClick={() => onCityChange(city.id)}
            className={`flex-1 relative flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              isActive 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="text-sm z-10">{city.icon}</span>
            <span className="z-10">{city.name}</span>
            {isActive && (
              <motion.div layoutId="activeDot" className="absolute bottom-2 w-1 h-1 bg-orange-500 rounded-full" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}