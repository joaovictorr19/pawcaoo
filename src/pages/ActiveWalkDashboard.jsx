import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import ActiveServiceCockpit from "@/components/service/ActiveServiceCockpit";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActiveWalkDashboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get("bookingId");

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!bookingId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-slate-500 text-sm">Reserva não encontrada.</p>
        <button
          onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}
          className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ActiveServiceCockpit bookingId={bookingId} user={user} />
    </div>
  );
}