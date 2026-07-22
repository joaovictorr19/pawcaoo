import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GraduationCap, Dog } from "lucide-react";

/**
 * Badge de Cargo Profissional - Exibe automaticamente o cargo correto
 * Se for Treinador: Badge dourado/premium "Treinador PawCão" (implica funcionário)
 * Se for Dog Walker: Badge verde/laranja "Dog Walker PawCão"
 */
export default function ProfessionalRoleBadge({ 
  isTrainer = false, 
  isWalker = false,
  isPawcaoEmployee = false,
  size = "md" 
}) {
  const sizeClasses = {
    sm: "h-6 px-2 text-[10px]",
    md: "h-7 px-2.5 text-xs",
    lg: "h-8 px-3 text-sm"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4"
  };

  // Lógica de prioridade: Treinador > Dog Walker
  // Se for treinador, não precisa mostrar "funcionário" separadamente
  if (isTrainer) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center gap-1.5 cursor-help flex-shrink-0 font-bold text-white shadow-lg border-2 border-yellow-300/60`}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
                boxShadow: '0 4px 12px -2px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
              }}
            >
              <GraduationCap className={`${iconSizes[size]} drop-shadow-md`} strokeWidth={2.5} />
              <span className="drop-shadow-sm">Treinador PawCão</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-yellow-400">
            <p className="font-bold text-sm">🎓 Treinador Certificado</p>
            <p className="text-xs">Profissional oficial da equipa PawCão</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Se for Dog Walker (com ou sem ser funcionário)
  if (isWalker || isPawcaoEmployee) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center gap-1.5 cursor-help flex-shrink-0 font-bold text-white shadow-lg border-2 border-green-300/60`}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                boxShadow: '0 4px 12px -2px rgba(34, 197, 94, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
              }}
            >
              <Dog className={`${iconSizes[size]} drop-shadow-md`} strokeWidth={2.5} />
              <span className="drop-shadow-sm">Dog Walker PawCão</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400">
            <p className="font-bold text-sm">🐕 Dog Walker Verificado</p>
            <p className="text-xs">Profissional oficial da equipa PawCão</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Se não tiver cargo, não mostra nada
  return null;
}