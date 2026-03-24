import React, { useMemo } from 'react';
import { ArrowUpRight } from "lucide-react";
import { BadgeStatic } from "@/components/ui/BadgeStatic";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function ProfessionalCard({ walker }) {
  const navigate = useNavigate();
  
  // 1. Memorizamos os dados da Wallet e Perfil para não recalcularem sempre
  const profileData = useMemo(() => ({
    photo: walker?.photo_url || walker?.professional_profile?.avatar_url || walker?.profile_photo_url,
    isVerified: walker?.verification_status === 'verified' || walker?.is_verified || walker?.professional_profile?.verification_status === 'verified',
    isTrained: walker?.is_verified_trainer || walker?.professional_profile?.is_trained,
    isPawcao: walker?.is_pawcao_employee || walker?.professional_profile?.is_pawcao
  }), [walker.id, walker.professional_profile, walker.verification_status, walker.is_verified, walker.is_verified_trainer, walker.is_pawcao_employee]); // Só muda se o ID ou o Perfil mudarem

  return (
    <div 
      className="bg-white rounded-[2.5rem] p-4 mb-3 border border-slate-100 shadow-sm flex gap-4 items-center cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(createPageUrl(`UserProfile?id=${walker.id}`))}
    >
      
      {/* 2. Container da Foto com KEY FIXA (Evita o sumiço) */}
      <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-inner">
        <img 
          key={`img-${walker.id}`} // KEY FIXA É VITAL
          src={profileData.photo}
          className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
          onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-100')}
          onError={(e) => {
             e.currentTarget.classList.replace('opacity-0', 'opacity-100');
             e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(walker.full_name || walker.walker_name || walker.trainer_name || 'P') + '&background=10b981&color=fff&size=200';
          }}
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-black text-slate-900 text-sm truncate">{walker.full_name || walker.walker_name || walker.trainer_name}</h3>
          
          {/* 3. Renderização Estática dos Emblemas (Não Piscam) */}
          <div className="flex gap-0.5 shrink-0">
            {profileData.isVerified && <BadgeStatic type="verified" />}
            {profileData.isTrained && <BadgeStatic type="trained" />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profileData.isPawcao && (
            <span className="bg-orange-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
              Parceiro PawGo
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate">
            {walker.city || walker.location || "Porto"}
          </span>
        </div>
      </div>

      {/* Seta de ação para indicar que é clicável */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        {walker.hourly_rate && (
            <span className="text-xs font-black text-green-600">{walker.hourly_rate}€<span className="text-[9px] text-slate-400">/h</span></span>
        )}
        <ArrowUpRight size={16} className="text-slate-300" />
      </div>
    </div>
  );
}