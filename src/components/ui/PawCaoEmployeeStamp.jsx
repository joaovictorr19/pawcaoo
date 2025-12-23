import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";

export default function PawCaoEmployeeStamp() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden cursor-help transform rotate-[-12deg] hover:rotate-0 transition-transform duration-300"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
              border: '3px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Inner circle border */}
            <div 
              className="absolute inset-1 rounded-full border-2 border-dashed border-white/50"
            />
            
            {/* Glossy effect */}
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" 
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)' }} 
            />
            
            {/* Icon */}
            <ShieldCheck className="w-7 h-7 text-white drop-shadow-md z-10" strokeWidth={2.5} />
            
            {/* Text around stamp effect */}
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <span className="text-[6px] font-bold text-white/90 uppercase tracking-widest">
                Oficial
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-green-700 text-white border-green-500">
          <p className="font-bold text-sm">🛡️ Oficial da PawCão</p>
          <p className="text-xs">Membro verificado da equipa PawCão</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}