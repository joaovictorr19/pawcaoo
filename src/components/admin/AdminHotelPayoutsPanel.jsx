import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Building2, Send, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const RELEASEABLE_STATUSES = ["checked_out", "completed"];

function fmtEUR(v) {
  return `€${Number(v || 0).toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
  dropin: "Visita",
  transport: "Transporte",
};

export default function AdminHotelPayoutsPanel() {
  const queryClient = useQueryClient();
  const [releasingId, setReleasingId] = useState(null);
  const [resultById, setResultById] = useState({});

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["adminHotelPayouts"],
    queryFn: async () => {
      const all = await base44.entities.HotelBooking.list("-created_date", 2000);
      return (Array.isArray(all) ? all : []).filter(
        (b) =>
          RELEASEABLE_STATUSES.includes(b.status) &&
          b.payment_status !== "released"
      );
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRelease = async (bookingId) => {
    if (!confirm("Confirmar a transferência do valor do serviço para a conta Stripe do hotel?")) return;
    setReleasingId(bookingId);
    setResultById((s) => ({ ...s, [bookingId]: null }));
    try {
      const res = await base44.functions.invoke("releaseHotelPayout", { bookingId });
      if (res?.transfer_id) {
        toast.success(`Transferido: ${fmtEUR(res.released)} para o hotel via Stripe.`);
        setResultById((s) => ({ ...s, [bookingId]: { ok: true, transfer_id: res.transfer_id } }));
      } else if (res?.payout_status === "failed") {
        toast.error("Transferência falhou — o hotel tem Stripe Connect configurado?");
        setResultById((s) => ({ ...s, [bookingId]: { ok: false, msg: "Stripe Connect não configurado" } }));
      } else {
        toast.info(res?.message || "Operação concluída.");
        setResultById((s) => ({ ...s, [bookingId]: { ok: true } }));
      }
      queryClient.invalidateQueries({ queryKey: ["adminHotelPayouts"] });
    } catch (e) {
      const msg = e?.message || "Erro ao transferir";
      toast.error(msg);
      setResultById((s) => ({ ...s, [bookingId]: { ok: false, msg } }));
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#1D8A82]" />
          <h3 className="text-sm font-extrabold text-slate-900">Transferir Pagamentos a Hotéis</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["adminHotelPayouts"] })}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="p-6 text-sm text-slate-500">A carregar reservas libertáveis…</div>
      ) : bookings.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          Sem pagamentos pendentes de transferência.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {bookings.map((b) => {
            const res = resultById[b.id];
            const isReleasing = releasingId === b.id;
            return (
              <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {b.hotel_name || "Hotel"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {SERVICE_LABELS[b.service_type] || b.service_type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {b.status === "completed" ? "Concluída" : "Check-out"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {b.owner_name || b.owner_email} · {fmtDate(b.checkin_date)}
                    {b.checkout_date && b.checkout_date !== b.checkin_date ? ` → ${fmtDate(b.checkout_date)}` : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Hotel: {b.hotel_email || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      {fmtEUR(b.service_amount)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      comissão {fmtEUR(b.platform_fee)}
                    </p>
                  </div>

                  {res?.ok ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Transferido
                    </span>
                  ) : res && !res.ok ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500" title={res.msg}>
                      <AlertCircle className="w-4 h-4" /> Falhou
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRelease(b.id)}
                      disabled={isReleasing}
                      className="bg-[#1D8A82] hover:bg-[#176f68] text-white gap-1.5"
                    >
                      {isReleasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Transferir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}