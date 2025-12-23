import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PawCaoEmployeeStamp() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center relative cursor-help transform rotate-[-15deg] hover:rotate-[-5deg] transition-transform duration-500"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full"
              style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))' }}
            >
              {/* Outer circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="46" 
                fill="none" 
                stroke="#16a34a" 
                strokeWidth="3"
                strokeDasharray="4 2"
                opacity="0.9"
              />
              
              {/* Inner circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none" 
                stroke="#16a34a" 
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Circular text path - top */}
              <defs>
                <path 
                  id="textCircleTop" 
                  d="M 50,50 m -32,0 a 32,32 0 1,1 64,0"
                  fill="none"
                />
                <path 
                  id="textCircleBottom" 
                  d="M 50,50 m 32,0 a 32,32 0 1,1 -64,0"
                  fill="none"
                />
              </defs>

              {/* Top text */}
              <text 
                fill="#16a34a" 
                fontSize="8" 
                fontWeight="bold" 
                letterSpacing="3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle">
                  EQUIPA PAWCÃO
                </textPath>
              </text>

              {/* Bottom text */}
              <text 
                fill="#16a34a" 
                fontSize="8" 
                fontWeight="bold" 
                letterSpacing="3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                <textPath href="#textCircleBottom" startOffset="50%" textAnchor="middle">
                  EQUIPA PAWCÃO
                </textPath>
              </text>

              {/* Center star/paw icon */}
              <text 
                x="50" 
                y="54" 
                textAnchor="middle" 
                fontSize="18"
                fill="#16a34a"
              >
                🐾
              </text>
            </svg>
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