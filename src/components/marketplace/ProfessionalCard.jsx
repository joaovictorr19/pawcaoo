import React, { useMemo } from 'react';
import { ArrowUpRight, Globe, Briefcase } from "lucide-react";
import { BadgeStatic } from "@/components/ui/BadgeStatic";
import { AnimalIconsList } from "@/components/professionals/AnimalIcons";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSealConfiguration, getProfileSeals, sealToBorderStyle, sealToBadgeStyle } from "@/hooks/useSealConfiguration";

export function ProfessionalCard({ walker }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getConfig } = useSealConfiguration();

  const profileData = useMemo(() => ({
    photo: walker?.photo_url || walker?.professional_profile?.avatar_url || walker?.profile_photo_url,
    cover: walker?.cover_photo_url || walker?.professional_profile?.cover_photo_url,
    isVerified: walker?.verification_status === 'verified' || walker?.is_verified || walker?.professional_profile?.verification_status === 'verified',
    isTrained: walker?.is_verified_trainer || walker?.professional_profile?.is_trained,
    isPawcao: !!(walker?.has_pawcao_seal || walker?.is_pawcao_employee),
    isHotel: walker?.professional_type === 'hotel',
    isTrainer: walker?.professional_type === 'trainer' || walker?.professional_type === 'both' || walker?.is_verified_trainer === true,
  }), [walker.id, walker.has_pawcao_seal, walker.is_pawcao_employee, walker.verification_status, walker.is_verified, walker.is_verified_trainer, walker.professional_type]);

  // Determine the primary seal for dynamic border styling
  const activeSeals = useMemo(() => getProfileSeals(walker), [walker]);
  const primarySeal = activeSeals[0]; // First matching seal takes priority
  const sealConfig = getConfig(primarySeal);
  const borderStyle = sealConfig ? sealToBorderStyle(sealConfig) : null;

  const displayName = walker.hotel_details?.hotel_name || walker.full_name || walker.walker_name || walker.trainer_name;
  const bio = walker?.bio || walker?.hotel_details?.hotel_description || walker?.professional_profile?.bio || '';
  const city = walker.city || walker.location || 'Portugal';
  const acceptedAnimals = walker?.accepted_animals?.length ? walker.accepted_animals : ['dogs'];
  const languages = walker?.languages_spoken || [];
  const experienceYears = walker?.experience_years;

  return (
    <div
      className="bg-white rounded-[2rem] mb-3 border overflow-hidden cursor-pointer hover:shadow-lg transition-all flex flex-col group border-slate-100 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      style={borderStyle || {}}
      onClick={async () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const name = walker?.hotel_details?.hotel_name || walker?.walker_name;
        const type = walker?.professional_type === 'hotel' ? 'hotel' : 'walker';
        const link = await ensureProfileSlug(name, walker?.created_by, type);
        navigate(link);
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

      {/* Imagem dominante em cima */}
      <div className="relative w-full h-48 overflow-hidden bg-slate-100">
        <img
          key={`img-${walker.id}`}
          src={profileData.photo}
          className="w-full h-full object-cover object-top opacity-0 transition-all duration-500 group-hover:scale-105"
          onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
          onError={(e) => {
            e.currentTarget.classList.remove('opacity-0');
            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName || 'P') + '&background=10b981&color=fff&size=400';
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Badge de categoria no topo — dynamic color from seal config */}
        {primarySeal && sealConfig && (
          <span
            className="absolute top-3 left-3 text-[9px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-md"
            style={sealToBadgeStyle(sealConfig) || {}}
          >
            {sealConfig.badge_label}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <h3 className="font-heading font-bold text-slate-900 text-[15px] truncate tracking-tight">{displayName}</h3>
          <div className="flex gap-0.5 shrink-0">
            {profileData.isVerified && <BadgeStatic type="verified" />}
            {profileData.isTrained && <BadgeStatic type="trained" />}
          </div>
        </div>

        {bio ? (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
            {bio}
          </p>
        ) : (
          <p className="text-xs text-slate-300 italic mb-2">Profissional verificado PawCão</p>
        )}

        {/* Info row: accepted animals, languages, experience */}
        {(acceptedAnimals.length > 0 || languages.length > 0 || experienceYears != null) && (
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            {acceptedAnimals.length > 0 && (
              <AnimalIconsList acceptedAnimals={acceptedAnimals} size="sm" />
            )}
            {languages.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
                <Globe className="w-3 h-3" />
                {languages.slice(0, 3).join(', ')}
              </span>
            )}
            {experienceYears != null && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
                <Briefcase className="w-3 h-3" />
                {experienceYears}a exp
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate">
            {city}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {profileData.isHotel ? (
              (() => {
                const ppn = walker?.hotel_details?.price_per_night;
                const services = walker?.hotel_details?.services || [];
                const prices = services.map(s => s.price_per_day).filter(p => p > 0);
                const minServicePrice = prices.length > 0 ? Math.min(...prices) : null;
                const displayPrice = ppn || minServicePrice;
                return displayPrice ? (
                  <span className="text-sm font-black text-purple-600">{displayPrice}€<span className="text-[9px] text-slate-400">/noite</span></span>
                ) : null;
              })()
            ) : (
              walker.hourly_rate ? (
                <span className="text-sm font-black text-teal-600">{walker.hourly_rate}€<span className="text-[9px] text-slate-400">/h</span></span>
              ) : null
            )}
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}