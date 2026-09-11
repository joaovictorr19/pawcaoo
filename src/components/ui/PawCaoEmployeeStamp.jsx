import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/components/LanguageContext";
import { getSealLabel, getSealDescription } from "@/hooks/useSealConfiguration";

export default function PawCaoEmployeeStamp() {
  const { language } = useLanguage();
  const teamLabel = getSealLabel("equipa_pawcao", language) || "{teamLabel}";
  const officialLabel = getSealDescription("pawcao_official", language) || "Oficial da PawCão";
  const memberDesc = getSealDescription("equipa_pawcao", language) || "Membro verificado da equipa PawCão";
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
              style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.4))' }}
            >
              {/* Outer circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="46" 
                fill="none" 
                stroke="#d4a020" 
                strokeWidth="2.5"
                strokeDasharray="3 2"
                opacity="0.95"
              />
              
              {/* Inner circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none" 
                stroke="#d4a020" 
                strokeWidth="1.5"
                opacity="0.9"
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
                fill="#d4a020" 
                fontSize="7.5" 
                fontWeight="500" 
                letterSpacing="2.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle">
                  {teamLabel}
                </textPath>
              </text>

              {/* Bottom text */}
              <text 
                fill="#d4a020" 
                fontSize="7.5" 
                fontWeight="500" 
                letterSpacing="2.5"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <textPath href="#textCircleBottom" startOffset="50%" textAnchor="middle">
                  {teamLabel}
                </textPath>
              </text>

              {/* Center paw icon - SVG drawn */}
              <g transform="translate(50, 50) scale(0.35)">
                {/* Main pad */}
                <ellipse cx="0" cy="8" rx="14" ry="12" fill="#d4a020" />
                {/* Top pads */}
                <ellipse cx="-12" cy="-8" rx="6" ry="7" fill="#d4a020" />
                <ellipse cx="12" cy="-8" rx="6" ry="7" fill="#d4a020" />
                <ellipse cx="-5" cy="-16" rx="5" ry="6" fill="#d4a020" />
                <ellipse cx="5" cy="-16" rx="5" ry="6" fill="#d4a020" />
              </g>
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-green-700 text-white border-green-500">
          <p className="font-bold text-sm">🛡️ {officialLabel}</p>
          <p className="text-xs">{memberDesc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}