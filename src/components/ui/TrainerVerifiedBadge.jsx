import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GraduationCap } from "lucide-react";

export default function TrainerVerifiedBadge({ size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden shadow-md border-2 border-purple-400/50 cursor-help flex-shrink-0`}
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',
              boxShadow: '0 4px 6px -1px rgba(168, 85, 247, 0.4), 0 2px 4px -1px rgba(168, 85, 247, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)' }} />
            <GraduationCap className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white drop-shadow-md z-10`} strokeWidth={2.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-purple-900 text-white border-purple-700">
          <p className="font-semibold">Treinador Verificado</p>
          <p className="text-xs">Certificado pela PawCão</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}