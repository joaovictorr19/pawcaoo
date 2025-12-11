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
      title={dogsCount > 0 ? `${dogsCount} ${dogsCount === 1 ? 'Cão' : 'Cães'} cadastrado(s)` : 'Adicionar Cão'}
    >
      {/* SVG Premium Closed Leather Collar - 3D Loop Design */}
      <svg width="56" height="56" viewBox="0 0 56 56" className="drop-shadow-lg hover:drop-shadow-xl transition-all">
        <defs>
          {/* Gradiente 3D para Couro Marrom Rico */}
          <linearGradient id="leatherFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#A0522D', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#8B4513', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#6F3B1F', stopOpacity: 1}} />
          </linearGradient>
          
          {/* Gradiente para a parte de trás (mais escura) */}
          <linearGradient id="leatherBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#6F3B1F', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#4A2810', stopOpacity: 1}} />
          </linearGradient>
          
          {/* Gradiente Metálico Bronze/Dourado Envelhecido */}
          <radialGradient id="bronzeMetal" cx="40%" cy="30%">
            <stop offset="0%" style={{stopColor: '#E5C685', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#BC6C25', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#8B5A00', stopOpacity: 1}} />
          </radialGradient>
        </defs>
        
        {/* Parte de Trás da Coleira (mais fina, escura) */}
        <ellipse 
          cx="28" 
          cy="24" 
          rx="18" 
          ry="16" 
          fill="none" 
          stroke="url(#leatherBack)" 
          strokeWidth="3" 
          opacity="0.6"
        />
        
        {/* Parte Frontal da Coleira (mais grossa, em destaque) */}
        <ellipse 
          cx="28" 
          cy="24" 
          rx="18" 
          ry="16" 
          fill="none" 
          stroke="url(#leatherFront)" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        
        {/* Costura Pontilhada Superior (detalhe artesanal) */}
        <ellipse 
          cx="28" 
          cy="24" 
          rx="16" 
          ry="14" 
          fill="none" 
          stroke="#DEB887" 
          strokeWidth="0.5" 
          strokeDasharray="1.5,2"
          opacity="0.8"
        />
        
        {/* Furos de Ajuste (3 pontos no lado esquerdo) */}
        <circle cx="12" cy="24" r="1" fill="#1A1A1A" opacity="0.9" />
        <circle cx="12" cy="20" r="1" fill="#1A1A1A" opacity="0.9" />
        <circle cx="12" cy="28" r="1" fill="#1A1A1A" opacity="0.9" />
        
        {/* Argola Metálica de Suspensão (centro inferior) */}
        <circle 
          cx="28" 
          cy="40" 
          r="2" 
          fill="none" 
          stroke="#888" 
          strokeWidth="1.2"
        />
        
        {/* Elo de Conexão */}
        <line 
          x1="28" 
          y1="42" 
          x2="28" 
          y2="45" 
          stroke="#888" 
          strokeWidth="0.8"
        />
        
        {/* Medalha Circular (Moeda de Bronze) */}
        <circle 
          cx="28" 
          cy="50" 
          r="5.5" 
          fill="url(#bronzeMetal)" 
          stroke="#6F4E37" 
          strokeWidth="0.8"
        />
        
        {/* Brilho Metálico no Pingente */}
        <ellipse 
          cx="26.5" 
          cy="48.5" 
          rx="1.8" 
          ry="1.5" 
          fill="#FFF" 
          opacity="0.4"
        />
        
        {/* Borda Elevada da Moeda (anel interno) */}
        <circle 
          cx="28" 
          cy="50" 
          r="4.5" 
          fill="none" 
          stroke="#9B7653" 
          strokeWidth="0.4"
          opacity="0.7"
        />
        
        {/* Número ou Símbolo Gravado em Baixo-relevo */}
        {dogsCount > 0 ? (
          <text 
            x="28" 
            y="52.5" 
            textAnchor="middle" 
            fontSize="6" 
            fontWeight="700" 
            fill="#5D3A1A"
            fontFamily="'Georgia', serif"
            opacity="0.9"
          >
            {dogsCount}
          </text>
        ) : (
          <text 
            x="28" 
            y="53" 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="700" 
            fill="#5D3A1A"
            fontFamily="'Georgia', serif"
            opacity="0.9"
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