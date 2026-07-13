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
    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
      {allPartnerships.map((p) => {
        const roleLabel = ROLE_LABELS[p.partner_role] || 'Parceiro';
        return (
          <button
            key={p.hotel_profile_id}
            onClick={() => navigate(`${createPageUrl("UserProfile")}?id=${p.hotel_profile_id}`)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1.5 pr-3 py-1 hover:border-slate-400 hover:shadow-sm transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {p.hotel_photo_url ? (
                <img
                  src={p.hotel_photo_url}
                  alt={p.hotel_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-semibold text-slate-700 leading-tight">
                {roleLabel}
              </p>
              <p className="text-[9px] text-slate-400 leading-tight truncate max-w-[100px]">
                {p.hotel_name}
              </p>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        );
      })}
    </div>
  );
}