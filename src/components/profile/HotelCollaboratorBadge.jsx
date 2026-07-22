import React from "react";
import { Building2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const ROLE_LABELS = {
  simple: "Parceiro",
  limited: "Colaborador",
  full: "Funcionário",
};

export default function HotelCollaboratorBadge({ walkerProfile }) {
  const navigate = useNavigate();
  const partnerships = walkerProfile?.hotel_partnerships || [];
  const profileEmail = walkerProfile?.created_by;

  const { data: fallbackPartnerships = [] } = useQuery({
    queryKey: ['collaboratorBadges', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const hotels = await base44.entities.WalkerProfile.filter(
        { professional_type: 'hotel' },
        undefined,
        100
      );
      const found = [];
      for (const h of hotels) {
        const partners = h.hotel_details?.partner_walkers || [];
        const match = partners.find(
          p => p.walker_email?.toLowerCase() === profileEmail.toLowerCase()
        );
        if (match) {
          found.push({
            hotel_profile_id: h.id,
            hotel_name: h.hotel_details?.hotel_name || h.walker_name || 'Hotel',
            hotel_photo_url: h.photo_url || '',
            partner_role: match.partner_role || 'simple',
            custom_title: match.custom_title || '',
          });
        }
      }
      return found;
    },
    enabled: !!profileEmail && partnerships.length === 0,
    staleTime: 10 * 60 * 1000,
  });

  const allPartnerships = partnerships.length > 0 ? partnerships : fallbackPartnerships;

  if (!allPartnerships || allPartnerships.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
      {allPartnerships.map((p) => {
        const roleLabel = p.custom_title || ROLE_LABELS[p.partner_role] || 'Parceiro';
        return (
          <button
            key={p.hotel_profile_id}
            onClick={() => navigate(`${createPageUrl("UserProfile")}?id=${p.hotel_profile_id}`)}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl pl-3 pr-4 py-2.5 hover:border-slate-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {p.hotel_photo_url ? (
                <img
                  src={p.hotel_photo_url}
                  alt={p.hotel_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Building2 className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {roleLabel}
              </p>
              <p className="text-xs text-slate-400 leading-tight truncate max-w-[140px]">
                {p.hotel_name}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </button>
        );
      })}
    </div>
  );
}