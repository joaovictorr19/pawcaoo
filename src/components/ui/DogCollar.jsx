import React from "react";
import { Dog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function DogCollar({ userEmail, onClick }) {
  const { data: dogsCount = 0, isLoading } = useQuery({
    queryKey: ['dogsCount', userEmail],
    queryFn: async () => {
      if (!userEmail) return 0;
      const dogs = await base44.entities.DogProfile.filter({ owner_email: userEmail });
      return dogs.length;
    },
    enabled: !!userEmail,
  });

  if (isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 cursor-pointer group"
      onClick={onClick}
      title="Gerenciar Meus Cães"
    >
      {/* SVG Closed Leather Collar with Hanging Tag */}
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-md">
        {/* Closed Collar Circle */}
        <ellipse 
          cx="40" 
          cy="35" 
          rx="28" 
          ry="25" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="6" 
        />
        
        {/* Inner highlight for depth */}
        <ellipse 
          cx="40" 
          cy="33" 
          rx="26" 
          ry="23" 
          fill="none" 
          stroke="#A0522D" 
          strokeWidth="2" 
          opacity="0.6"
        />
        
        {/* Buckle on top */}
        <rect 
          x="36" 
          y="8" 
          width="8" 
          height="6" 
          rx="1" 
          fill="#C0C0C0" 
          stroke="#888" 
          strokeWidth="0.5"
        />
        
        {/* Hanging Tag/Pendant (Center Bottom) */}
        <line x1="40" y1="60" x2="40" y2="65" stroke="#C0C0C0" strokeWidth="1.5" />
        
        {/* Medal/Tag Circle */}
        <circle cx="40" cy="70" r="9" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
        <circle cx="40" cy="70" r="7.5" fill="#FFB700" />
        
        {/* Counter or + Icon inside Tag */}
        {dogsCount > 0 ? (
          <text x="40" y="74" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#8B4513">
            {dogsCount}
          </text>
        ) : (
          <text x="40" y="75" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8B4513">
            +
          </text>
        )}
      </svg>
      
      {/* Hover Text */}
      <span className="text-xs font-semibold text-gray-600 group-hover:text-green-600 transition-colors hidden sm:inline">
        {dogsCount > 0 ? `${dogsCount} ${dogsCount === 1 ? 'Cão' : 'Cães'}` : 'Adicionar Cão'}
      </span>
    </motion.div>
  );
}