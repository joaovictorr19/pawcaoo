import React from "react";
import { Hotel, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HotelCollaboratorBadge({ walkerProfile }) {
  const navigate = useNavigate();
  const partnerships = walkerProfile?.hotel_partnerships;

  if (!partnerships || partnerships.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
      {partnerships.map((p) => (
        <button
          key={p.hotel_profile_id}
          onClick={() => navigate(createPageUrl("UserProfile"), { state: { profileId: p.hotel_profile_id } })}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-full pl-1.5 pr-3 py-1 hover:border-purple-400 hover:shadow-sm transition-all group"
        >
          <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 overflow-hidden flex items-center justify-center shrink-0">
            {p.hotel_photo_url ? (
              <img
                src={p.hotel_photo_url}
                alt={p.hotel_name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <Hotel className="w-3.5 h-3.5 text-purple-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-purple-700 leading-tight">
              Colaborador
            </p>
            <p className="text-[9px] text-slate-500 leading-tight truncate max-w-[100px]">
              {p.hotel_name}
            </p>
          </div>
          <ExternalLink className="w-3 h-3 text-purple-300 group-hover:text-purple-500 transition-colors" />
        </button>
      ))}
    </div>
  );
}