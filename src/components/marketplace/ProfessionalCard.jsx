import React, { useMemo } from 'react';
import { ArrowUpRight } from "lucide-react";
import { BadgeStatic } from "@/components/ui/BadgeStatic";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { buildShortProfileLink } from "@/utils/profileSlug";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function ProfessionalCard({ walker }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 1. Memorizamos os dados da Wallet e Perfil para não recalcularem sempre
  const profileData = useMemo(() => ({
    photo: walker?.photo_url || walker?.professional_profile?.avatar_url || walker?.profile_photo_url,
    isVerified: walker?.verification_status === 'verified' || walker?.is_verified || walker?.professional_profile?.verification_status === 'verified',
    isTrained: walker?.is_verified_trainer || walker?.professional_profile?.is_trained,
    isPawcao: !!(walker?.has_pawcao_seal || walker?.is_pawcao_employee),
    isHotel: walker?.professional_type === 'hotel',
  }), [walker.id, walker.has_pawcao_seal, walker.is_pawcao_employee, walker.verification_status, walker.is_verified, walker.is_verified_trainer, walker.professional_type]);

  return (
    <div className={`bg-white rounded-[2.5rem] p-4 mb-3 border shadow-sm flex gap-4 items-center cursor-pointer hover:shadow-md transition-shadow
      ${profileData.isHotel ? 'border-purple-400 ring-2 ring-purple-300/60 shadow-purple-50' : profileData.isPawcao ? 'border-amber-400 ring-2 ring-amber-300/60 shadow-amber-100' : 'border-slate-100'}`}
      onClick={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const name = walker?.hotel_details?.hotel_name || walker?.walker_name;
        navigate(buildShortProfileLink(name, walker?.created_by));
      }}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ['profileUser', walker.id, null, null, false, undefined],
          queryFn: async () => {
            const [r1, r2, wm] = await Promise.allSettled([
              base44.entities.UserProfile.filter({ id: walker.id }),
              base44.entities.UserProfile.filter({ user_id: walker.id }),
              base44.entities.WalkerProfile.get(walker.id),
            ]);
            let userProfile = null;
            if (r1.status === 'fulfilled' && r1.value?.length > 0) userProfile = r1.value[0];
            else if (r2.status === 'fulfilled' && r2.value?.length > 0) userProfile = r2.value[0];
            else if (wm.status === 'fulfilled' && wm.value?.id) {
              const w = wm.value;
              userProfile = { id: w.id, user_id: w.user_id || walker.id, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: w.professional_type || 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
            }
            return userProfile;
          },
          staleTime: 30 * 1000,
        });
      }}>
      
      {/* 2. Container da Foto com KEY FIXA (Evita o sumiço) */}
      <div className={`relative w-16 h-16 shrink-0 rounded-2xl bg-slate-100 overflow-hidden border-2 shadow-inner ${profileData.isHotel ? 'border-purple-300' : 'border-white'}`}>
        <img 
          key={`img-${walker.id}`} // KEY FIXA É VITAL
          src={profileData.photo}
          className="w-full h-full object-cover transition-opacity duration-500 opacity-0"
          onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
          onError={(e) => {
             e.currentTarget.classList.remove('opacity-0');
             e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(walker.hotel_details?.hotel_name || walker.full_name || walker.walker_name || walker.trainer_name || 'P') + '&background=10b981&color=fff&size=200';
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-heading font-bold text-slate-900 text-sm truncate tracking-tight">{walker.hotel_details?.hotel_name || walker.full_name || walker.walker_name || walker.trainer_name}</h3>
          
          {/* 3. Renderização Estática dos Emblemas (Não Piscam) */}
          <div className="flex gap-0.5 shrink-0">
            {profileData.isVerified && <BadgeStatic type="verified" />}
            {profileData.isTrained && <BadgeStatic type="trained" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {profileData.isHotel && (
            <span className="bg-purple-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
              Hotel Canino
            </span>
          )}
          {!profileData.isHotel && profileData.isPawcao && (
            <span className="bg-orange-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
              Parceiro PawGo
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate">
            {walker.city || walker.location || "Porto"}
          </span>
          {profileData.galleryCount > 0 && (
            <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
              📷 +{profileData.galleryCount} fotos
            </span>
          )}
        </div>
      </div>

      {/* Seta de ação para indicar que é clicável */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        {profileData.isHotel ? (
          (() => {
            const services = walker?.hotel_details?.services || [];
            const prices = services.map(s => s.price_per_day).filter(p => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : null;
            return minPrice ? (
              <span className="text-xs font-black text-purple-600">{minPrice}€<span className="text-[9px] text-slate-400">/noite</span></span>
            ) : null;
          })()
        ) : (
          walker.hourly_rate ? (
            <span className="text-xs font-black text-green-600">{walker.hourly_rate}€<span className="text-[9px] text-slate-400">/h</span></span>
          ) : null
        )}
        <ArrowUpRight size={16} className="text-slate-300" />
      </div>
    </div>
  );
}