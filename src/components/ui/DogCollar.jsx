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
      {/* SVG Premium Leather Collar - Luxury Design */}
      <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-lg hover:drop-shadow-xl transition-all">
        <defs>
          {/* Gradiente 3D para Tira de Couro */}
          <linearGradient id="leatherGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#A0522D', stopOpacity: 1}} />
            <stop offset="40%" style={{stopColor: '#8B4513', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#654321', stopOpacity: 1}} />
          </linearGradient>
          
          {/* Gradiente Metálico Dourado */}
          <radialGradient id="goldGrad" cx="40%" cy="30%">
            <stop offset="0%" style={{stopColor: '#FFF8DC', stopOpacity: 1}} />
            <stop offset="40%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
            <stop offset="70%" style={{stopColor: '#DAA520', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#B8860B', stopOpacity: 1}} />
          </radialGradient>
        </defs>
        
        {/* Tira de Couro (Curva Fechada com Volume) */}
        <ellipse 
          cx="32" 
          cy="26" 
          rx="22" 
          ry="20" 
          fill="none" 
          stroke="url(#leatherGrad)" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        
        {/* Highlight de Brilho do Couro Polido */}
        <ellipse 
          cx="32" 
          cy="24" 
          rx="20" 
          ry="18" 
          fill="none" 
          stroke="#CD853F" 
          strokeWidth="1.2" 
          opacity="0.4"
        />
        
        {/* Costura Artesanal Pontilhada (Detalhe Premium) */}
        <ellipse 
          cx="32" 
          cy="26" 
          rx="18" 
          ry="16" 
          fill="none" 
          stroke="#DEB887" 
          strokeWidth="0.7" 
          strokeDasharray="1.5,2.5"
          opacity="0.9"
        />
        
        {/* Furos do Ajuste (4 pontos distribuídos) */}
        <circle cx="12" cy="26" r="1" fill="#3E2723" opacity="0.8" />
        <circle cx="22" cy="18" r="1" fill="#3E2723" opacity="0.8" />
        <circle cx="42" cy="18" r="1" fill="#3E2723" opacity="0.8" />
        <circle cx="52" cy="26" r="1" fill="#3E2723" opacity="0.8" />
        
        {/* Fivela Metálica Premium */}
        <rect 
          x="28" 
          y="4" 
          width="8" 
          height="6" 
          rx="1.2" 
          fill="#D3D3D3" 
          stroke="#A9A9A9" 
          strokeWidth="0.6"
        />
        <rect 
          x="29.5" 
          y="5.5" 
          width="5" 
          height="3" 
          rx="0.5" 
          fill="#808080"
        />
        
        {/* Argola de Suspensão (Ring) */}
        <circle cx="32" cy="46" r="2.2" fill="none" stroke="#A9A9A9" strokeWidth="1" />
        
        {/* Corrente Fina Conectando à Medalha */}
        <line x1="32" y1="48.2" x2="32" y2="52" stroke="#A9A9A9" strokeWidth="0.8" />
        
        {/* Medalha Metálica Dourada (Luxury Tag) */}
        <circle cx="32" cy="57" r="7.5" fill="url(#goldGrad)" stroke="#B8860B" strokeWidth="1" />
        
        {/* Anel Interior da Medalha (Detalhe Gravado) */}
        <circle cx="32" cy="57" r="6.2" fill="none" stroke="#FFE680" strokeWidth="0.5" opacity="0.7" />
        
        {/* Número ou Ícone "+" Gravado */}
        {dogsCount > 0 ? (
          <text 
            x="32" 
            y="60.5" 
            textAnchor="middle" 
            fontSize="9" 
            fontWeight="700" 
            fill="#654321"
            fontFamily="'Georgia', serif"
          >
            {dogsCount}
          </text>
        ) : (
          <text 
            x="32" 
            y="61.5" 
            textAnchor="middle" 
            fontSize="13" 
            fontWeight="700" 
            fill="#654321"
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