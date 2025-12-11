import React from "react";
import { Dog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

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

  if (isLoading || dogsCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 cursor-pointer group"
      onClick={onClick}
      title="Gerenciar Meus Cães"
    >
      {/* SVG Leather Collar */}
      <svg width="120" height="32" viewBox="0 0 120 32" className="drop-shadow-md">
        {/* Leather strap */}
        <rect x="0" y="12" width="120" height="8" rx="4" fill="#8B4513" />
        <rect x="0" y="12" width="120" height="3" rx="1.5" fill="#A0522D" opacity="0.6" />
        
        {/* Buckle */}
        <rect x="5" y="10" width="12" height="12" rx="2" fill="#C0C0C0" stroke="#888" strokeWidth="1" />
        <rect x="8" y="13" width="6" height="6" rx="1" fill="#666" />
        
        {/* Studs */}
        <circle cx="25" cy="16" r="2" fill="#FFD700" />
        <circle cx="35" cy="16" r="2" fill="#FFD700" />
        <circle cx="45" cy="16" r="2" fill="#FFD700" />
        
        {/* Tag (Badge with count) */}
        <g transform="translate(85, 8)">
          <circle cx="12" cy="8" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
          <circle cx="12" cy="8" r="10" fill="#FFB700" />
          <text x="12" y="12" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8B4513">
            {dogsCount}
          </text>
        </g>
      </svg>
      
      {/* Hover Text */}
      <span className="text-xs font-semibold text-gray-600 group-hover:text-green-600 transition-colors hidden sm:inline">
        {dogsCount} {dogsCount === 1 ? 'Cão' : 'Cães'}
      </span>
    </motion.div>
  );
}