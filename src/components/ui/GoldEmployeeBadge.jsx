import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getSealLabel, getSealDescription } from "@/hooks/useSealConfiguration";

export default function GoldEmployeeBadge({ size = "lg", position = "profile" }) {
  const { language } = useLanguage();
  const teamLabel = getSealLabel("equipa_pawcao", language) || "Equipa PawCão";
  const employeeDesc = getSealDescription("pawcao_employee", language) || "Funcionário oficial da empresa";
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-6 h-6"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden shadow-xl border-4 border-yellow-300/80 cursor-help animate-pulse-subtle`}
            style={{
              background: 'radial-gradient(circle at 30% 30%, #fbbf24 0%, #f59e0b 40%, #d97706 80%, #b45309 100%)',
              boxShadow: '0 8px 16px -2px rgba(251, 191, 36, 0.6), 0 4px 8px -2px rgba(251, 191, 36, 0.4), inset 0 4px 8px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Top gloss */}
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)' }} />
            
            {/* Sparkle effect */}
            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
              background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.8) 0%, transparent 30%)'
            }} />

            <Crown className={`${iconSizes[size]} text-white drop-shadow-lg z-10 fill-yellow-100/50`} strokeWidth={2.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-yellow-400">
          <p className="font-bold text-sm">👑 {teamLabel}</p>
          <p className="text-xs">{employeeDesc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}