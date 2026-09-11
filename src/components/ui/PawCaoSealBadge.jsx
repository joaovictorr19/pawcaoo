import React from "react";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getSealLabel } from "@/hooks/useSealConfiguration";

export default function PawCaoSealBadge({ size = "default", className = "" }) {
  const { language } = useLanguage();
  const sealLabel = getSealLabel("pawcao_seal", language) || "SELO PAWCÃO";
  const sizes = {
    small: "text-[10px] h-5 px-1.5 py-0.5",
    default: "text-xs h-6 px-2 py-1",
    large: "text-sm h-7 px-3 py-1.5"
  };

  return (
    <Badge 
      className={`bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white font-bold shadow-lg border-2 border-white ${sizes[size]} ${className}`}
      style={{ borderRadius: 0 }}
    >
      <Award className="w-3 h-3 mr-1" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
      <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{sealLabel}</span>
    </Badge>
  );
}