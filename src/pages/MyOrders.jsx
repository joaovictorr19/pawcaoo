import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { createPageUrl } from "@/utils";
import { Package, ShoppingBag, Truck, MapPin, Hotel, PackageOpen, Loader2 } from "lucide-react";

const STATUS = {
  pending: { label: "Aguarda pagamento", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Em preparação", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  shipped: { label: "Enviado", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { label: "Entregue", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelada", cls: "bg-red-50 text-red-700 border-red-200" },
};

const DELIVERY = {
  shipping: { label: "Entrega ao domicílio", icon: Truck },
  pickup: { label: "Recolha no local", icon: MapPin },
  with_stay: { label: "Na próxima estadia", icon: Hotel },
};

export default function MyOrders() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["ordersCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["myProductOrders", user?.email],
    queryFn: () =>
      base44.entities.ProductOrder.filter({ customer_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
    initialData: [],
  });

  if (loadingUser || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center">
          <Package className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">Minhas Encomendas</h1>
          <p className="text-xs text-slate-500">Compras feitas na Loja de Parceiros PawCão</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">Ainda não tens encomendas</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Explora a Loja de Parceiros e encontra produtos dos teus profissionais favoritos.
          </p>
          <a
            href={createPageUrl("Shop")}
            className="inline-flex items-center gap-2 bg-teal-600 text-white rounded-full px-6 py-3 font-bold text-sm hover:bg-teal-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Ir para a Loja
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS[order.status] || STATUS.pending;
            const delivery = DELIVERY[order.delivery_method] || DELIVERY.pickup;
            const items = order.items || [];
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{order.order_number || "Encomenda"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.partner_name || "Parceiro PawCão"} ·{" "}
                      {new Date(order.created_date).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${status.cls}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity}x · €{(item.unit_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">€{(item.total_price || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <delivery.icon className="w-3.5 h-3.5 text-teal-600" />
                    {delivery.label}
                  </span>
                  <div className="text-right">
                    {order.wallet_used > 0 && (
                      <p className="text-[11px] text-teal-600 font-semibold">
                        Saldo PawCão aplicado: €{order.wallet_used.toFixed(2)}
                      </p>
                    )}
                    <p className="text-base font-black text-teal-700">
                      Total: €{(order.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {order.delivery_method === "shipping" && order.shipping_address?.street && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Entrega em: {order.shipping_address.street}, {order.shipping_address.postal_code}{" "}
                    {order.shipping_address.city}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}