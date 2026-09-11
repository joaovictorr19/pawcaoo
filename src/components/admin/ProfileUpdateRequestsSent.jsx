import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Clock, CheckCircle2, Hourglass } from "lucide-react";

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "agora mesmo";
  const min = Math.floor(diff / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  const mo = Math.floor(d / 30);
  return `há ${mo} ${mo > 1 ? "meses" : "mês"}`;
}

export default function ProfileUpdateRequestsSent() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["profileUpdateRequestsSent"],
    queryFn: async () => {
      const res = await base44.entities.ProfileEditRequest.filter(
        { request_type: "admin_outbound" },
        "-created_date",
        50
      );
      return Array.isArray(res) ? res : [];
    },
    staleTime: 30 * 1000,
  });

  // Para cada pedido, buscar o updated_date do perfil correspondente para determinar
  // se o profissional já atualizou o perfil após o envio.
  const profileIds = useMemo(
    () =>
      requests
        .filter((r) => r.profile_id && r.profile_type)
        .map((r) => ({ id: r.profile_id, type: r.profile_type })),
    [requests]
  );

  const { data: profileUpdates = {} } = useQuery({
    queryKey: ["sentRequestProfiles", profileIds],
    queryFn: async () => {
      const map = {};
      await Promise.all(
        profileIds.map(async ({ id, type }) => {
          try {
            let profile;
            if (type === "trainer") {
              const list = await base44.entities.TrainerProfile.filter({ id });
              profile = list?.[0];
            } else {
              const list = await base44.entities.WalkerProfile.filter({ id });
              profile = list?.[0];
            }
            if (profile) map[id] = profile.updated_date;
          } catch {
            // perfil pode não existir mais
          }
        })
      );
      return map;
    },
    enabled: profileIds.length > 0,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Nenhuma mensagem enviada recentemente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const items = req.requested_changes?.requested_items || [];
        const adminMsg = req.requested_changes?.admin_message;
        const profileUpdated = profileUpdates[req.profile_id];
        const responded =
          profileUpdated &&
          new Date(profileUpdated) > new Date(req.created_date);

        return (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {req.professional_name || req.professional_email}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {req.professional_email}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {responded ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                    <CheckCircle2 className="w-3 h-3" /> Perfil atualizado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9E6] text-[#B8860B]">
                    <Hourglass className="w-3 h-3" /> Aguarda resposta
                  </span>
                )}
                <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(req.created_date)}
                </span>
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {items.map((item, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#1D8A82]"
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            )}

            {adminMsg && (
              <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                “{adminMsg}”
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}