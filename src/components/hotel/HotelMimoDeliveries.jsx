import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Gift, PawPrint, Calendar, Loader2, CheckCircle2, Package } from "lucide-react";
import DeliverMimoModal from "@/components/hotel/DeliverMimoModal";

export default function HotelMimoDeliveries({ hotelEmail }) {
  const queryClient = useQueryClient();
  const [deliverOrder, setDeliverOrder] = useState(null);

  const { data: pendingMimos = [], isLoading } = useQuery({
    queryKey: ["hotelPendingMimos", hotelEmail],
    queryFn: async () => {
      const orders = await base44.entities.ProductOrder.filter(
        { partner_company_email: hotelEmail, delivery_method: "with_stay" },
        "-created_date",
        50
      );
      return (orders || []).filter(
        (o) => !o.mimo_delivered_at && o.status !== "delivered" && o.status !== "cancelled" && o.payment_status === "paid"
      );
    },
    enabled: !!hotelEmail,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (pendingMimos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <Gift className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Sem mimos por entregar</p>
        <p className="text-xs text-slate-400 mt-0.5">Quando um cliente resgatar um mimo, aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {pendingMimos.map((order) => {
        const dogName = order.dog_name || "Cão";
        const isGift = order.is_pawcao_gift;
        return (
          <div
            key={order.id}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center gap-3"
          >
            <div className="shrink-0 w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              {isGift ? <Gift className="w-5 h-5 text-teal-600" /> : <Package className="w-5 h-5 text-teal-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-slate-900 text-sm leading-tight">
                  {order.items?.[0]?.product_name || "Mimo"}
                </p>
                {isGift && (
                  <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[9px] font-bold uppercase">
                    Oferta PawCão
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-0.5 font-medium">
                  <PawPrint className="w-3 h-3" /> {dogName}
                </span>
                <span className="text-slate-300">·</span>
                <span className="truncate">{order.customer_name}</span>
              </div>
            </div>
            <button
              onClick={() => setDeliverOrder(order)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Entregar
            </button>
          </div>
        );
      })}

      {deliverOrder && (
        <DeliverMimoModal
          order={deliverOrder}
          hotelEmail={hotelEmail}
          onClose={() => setDeliverOrder(null)}
          onDelivered={() => {
            setDeliverOrder(null);
            queryClient.invalidateQueries({ queryKey: ["hotelPendingMimos", hotelEmail] });
          }}
        />
      )}
    </div>
  );
}