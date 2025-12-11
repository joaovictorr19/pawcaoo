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
      className="inline-flex items-center gap-3 cursor-pointer group"
      onClick={onClick}
      title={dogsCount > 0 ? `${dogsCount} ${dogsCount === 1 ? 'Cão' : 'Cães'} cadastrado(s)` : 'Adicionar Cão'}
    >
      {/* SVG Realistic Leather Collar - Compact Design */}
      <svg width="100%" height="48" viewBox="0 0 140 48" className="drop-shadow-md hover:drop-shadow-lg transition-all">
        <defs>
          {/* Gradiente para Couro Marrom */}
          <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#A0522D', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#8B4513', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#6F3B1F', stopOpacity: 1}} />
          </linearGradient>
          
          {/* Gradiente Metálico Dourado/Bronze */}
          <radialGradient id="metalGradient" cx="50%" cy="30%">
            <stop offset="0%" style={{stopColor: '#FFEAA7', stopOpacity: 1}} />
            <stop offset="40%" style={{stopColor: '#DDA15E', stopOpacity: 1}} />
            <stop offset="80%" style={{stopColor: '#BC6C25', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#8B5A00', stopOpacity: 1}} />
          </radialGradient>
        </defs>
        
        {/* Arco Curvado da Faixa de Couro */}
        <path 
          d="M 20 15 Q 70 22 120 15" 
          fill="none" 
          stroke="url(#leatherGradient)" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        
        {/* Borda Escura para Profundidade */}
        <path 
          d="M 20 15 Q 70 22 120 15" 
          fill="none" 
          stroke="#5D3A1A" 
          strokeWidth="10" 
          strokeLinecap="round"
          opacity="0.5"
          transform="translate(0, 0.5)"
        />
        
        {/* Costura Superior (Pontilhada Bege) */}
        <path 
          d="M 22 12 Q 70 19 118 12" 
          fill="none" 
          stroke="#DEB887" 
          strokeWidth="0.8" 
          strokeDasharray="2,3"
          opacity="0.7"
        />
        
        {/* Costura Inferior (Pontilhada Bege) */}
        <path 
          d="M 22 18 Q 70 25 118 18" 
          fill="none" 
          stroke="#DEB887" 
          strokeWidth="0.8" 
          strokeDasharray="2,3"
          opacity="0.7"
        />
        
        {/* Furos de Ajuste (3 círculos pretos à esquerda) */}
        <circle cx="28" cy="15" r="1.5" fill="#1A1A1A" />
        <circle cx="35" cy="15.5" r="1.5" fill="#1A1A1A" />
        <circle cx="42" cy="16" r="1.5" fill="#1A1A1A" />
        
        {/* Argola Metálica (no centro) */}
        <circle 
          cx="70" 
          cy="19" 
          r="2.5" 
          fill="none" 
          stroke="#A9A9A9" 
          strokeWidth="1.2"
        />
        
        {/* Elo de Conexão (corrente fina) */}
        <line 
          x1="70" 
          y1="21.5" 
          x2="70" 
          y2="28" 
          stroke="#A9A9A9" 
          strokeWidth="1"
        />
        
        {/* Pingente Circular Metálico (Medalha) */}
        <circle 
          cx="70" 
          cy="36" 
          r="9" 
          fill="url(#metalGradient)" 
          stroke="#8B5A00" 
          strokeWidth="1.2"
        />
        
        {/* Brilho no Pingente */}
        <circle 
          cx="67" 
          cy="33" 
          r="3" 
          fill="#FFF" 
          opacity="0.3"
        />
        
        {/* Borda Interior Gravada */}
        <circle 
          cx="70" 
          cy="36" 
          r="7.5" 
          fill="none" 
          stroke="#BC6C25" 
          strokeWidth="0.6"
          opacity="0.6"
        />
        
        {/* Número/Ícone Gravado no Metal */}
        {dogsCount > 0 ? (
          <text 
            x="70" 
            y="40" 
            textAnchor="middle" 
            fontSize="10" 
            fontWeight="700" 
            fill="#5D3A1A"
            fontFamily="'Georgia', serif"
          >
            {dogsCount}
          </text>
        ) : (
          <text 
            x="70" 
            y="40.5" 
            textAnchor="middle" 
            fontSize="14" 
            fontWeight="700" 
            fill="#5D3A1A"
            fontFamily="'Georgia', serif"
          >
            +
          </text>
        )}
      </svg>
      
      <span className="text-xs font-semibold text-gray-600 group-hover:text-green-700 transition-colors hidden sm:inline">
        {dogsCount > 0 ? `${dogsCount} ${dogsCount === 1 ? 'Cão' : 'Cães'}` : 'Adicionar Cão'}
      </span>
    </motion.div>
  );
}