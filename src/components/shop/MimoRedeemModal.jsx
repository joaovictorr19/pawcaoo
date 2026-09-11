import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Gift, Loader2, PawPrint, Calendar, Check, ChevronRight, AlertCircle, Hotel
} from "lucide-react";

export default function MimoRedeemModal({ mimo, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["mimoCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Reservas de hotel ativas/futuras do cliente
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["clientActiveBookings", user?.email],
    queryFn: async () => {
      const all = await base44.entities.HotelBooking.filter(
        { owner_email: user.email },
        "-checkin_date",
        30
      );
      const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
      const today = new Date().toISOString().slice(0, 10);
      // Mimos só podem ser entregues em estadias reais (hotel/creche), não em passeios/treinos/dropin/transporte
      const stayTypes = ["boarding", "daycare"];
      return (all || []).filter(
        (b) =>
          activeStatuses.includes(b.status) &&
          stayTypes.includes(b.service_type) &&
          (b.checkout_date || b.checkin_date || "") >= today
      );
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!mimo) return null;

  const isFree = mimo.is_pawcao_mimo;

  const handleConfirm = async () => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
      return;
    }
    if (!selectedBooking) {
      toast.error("Seleciona a reserva onde queres entregar o mimo");
      return;
    }
    setProcessing(true);
    try {
      const response = await base44.functions.invoke("createProductOrderCheckout", {
        product_id: mimo.id,
        quantity: 1,
        booking_id: selectedBooking.id,
        dog_name: selectedBooking.dogs?.[0]?.dog_name || selectedBooking.dog_name || null,
      });
      const data = response.data;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.paid || data?.gift) {
        toast.success(
          isFree
            ? "Mimo resgatado! O hotel vai entregar ao teu cão 🐾"
            : "Compra confirmada! O hotel vai entregar ao teu cão 🐾"
        );
        queryClient.invalidateQueries({ queryKey: ["shopMimos"] });
        queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
        onClose();
        navigate(`/OrderSuccess?order_id=${data.order_id}`);
        return;
      }
      toast.error(data?.error || "Não foi possível processar");
      setProcessing(false);
    } catch (error) {
      console.error("Mimo checkout error:", error);
      toast.error(error?.response?.data?.error || "Erro ao processar");
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!mimo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 rounded-3xl">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold text-slate-900">
            <Gift className="w-5 h-5 text-teal-600" />
            {isFree ? "Oferecer mimo" : "Comprar mimo"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4">
          {/* Resumo do mimo */}
          <div className="flex gap-3 items-center bg-slate-100 rounded-xl p-2.5 mb-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 relative">
              {mimo.image_url && (
                <img src={mimo.image_url} alt={mimo.product_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm leading-tight truncate">{mimo.product_name}</p>
              <p className="text-xs text-slate-500 truncate">{mimo.partner_name}</p>
            </div>
            <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
              {isFree ? (
                <span className="text-teal-700 flex items-center gap-1"><Gift className="w-3.5 h-3.5" />Grátis</span>
              ) : (
                `€${(mimo.price_euro || 0).toFixed(2)}`
              )}
            </p>
          </div>

          {/* Seleção de reserva */}
          <p className="text-sm font-bold text-slate-900 mb-2">Para qual estadia?</p>

          {!user ? (
            <button
              onClick={() => navigate(`/login?from=${encodeURIComponent("/Shop")}`)}
              className="w-full flex items-center gap-2.5 bg-amber-50 rounded-xl p-3 text-left active:scale-[0.98] transition-transform"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Inicia sessão</p>
                <p className="text-xs text-amber-600">Precisas de sessão para resgatar mimos</p>
              </div>
            </button>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-50 border border-slate-100">
              <Hotel className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Sem estadias ativas</p>
              <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[220px]">
                Precisas de ter uma reserva de hotel ativa ou futura para oferecer um mimo ao teu cão.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {bookings.map((b) => {
                const dogName = b.dogs?.[0]?.dog_name || b.dog_name || "Cão";
                const selected = selectedBooking?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                      selected
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-100 bg-white hover:border-teal-200"
                    }`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-teal-500" : "bg-slate-100"}`}>
                      {selected ? <Check className="w-5 h-5 text-white" /> : <PawPrint className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{dogName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {b.checkin_date && format(new Date(b.checkin_date), "dd MMM", { locale: pt })}
                        {b.checkout_date && ` → ${format(new Date(b.checkout_date), "dd MMM", { locale: pt })}`}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{b.hotel_name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {user && bookings.length > 0 && (
            <p className="text-[11px] text-slate-400 text-center pt-3">
              {isFree
                ? "O hotel será notificado e entregará o mimo ao teu cão durante a estadia."
                : "Pagamento seguro · O hotel entrega o mimo e publica uma foto no diário."}
            </p>
          )}
        </div>

        {/* Sticky action bar */}
        {user && bookings.length > 0 && (
          <div className="sticky bottom-0 px-5 pb-5 pt-2 bg-white border-t border-slate-100">
            <button
              onClick={handleConfirm}
              disabled={processing || !selectedBooking}
              className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold flex items-center justify-between px-5 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center gap-2 mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A processar...
                </span>
              ) : (
                <>
                  <span className="text-sm font-medium opacity-90">
                    {isFree ? "Resgatar mimo" : "Pagar"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {!isFree && `€${(mimo.price_euro || 0).toFixed(2)}`}
                    <Gift className="w-4 h-4" />
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}