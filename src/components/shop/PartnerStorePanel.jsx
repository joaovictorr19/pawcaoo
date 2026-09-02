import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Package, ShoppingBag, Euro,
  Truck, MapPin, Hotel, PackageOpen, Loader2,
} from "lucide-react";
import PartnerProductForm from "@/components/shop/PartnerProductForm";

const DELIVERY = {
  shipping: { label: "Entrega", icon: Truck },
  pickup: { label: "Recolha", icon: MapPin },
  with_stay: { label: "Com estadia", icon: Hotel },
};

const STATUS = {
  pending: { label: "Aguarda pagamento", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  processing: { label: "Em preparação", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  shipped: { label: "Enviado", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  delivered: { label: "Entregue", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Cancelado", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function PartnerStorePanel({ user, professionalProfile }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState("products");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const partner = {
    partner_id: professionalProfile?.id || "",
    partner_name:
      professionalProfile?.walker_name ||
      professionalProfile?.hotel_details?.hotel_name ||
      professionalProfile?.trainer_name ||
      user?.full_name ||
      "",
    partner_email: user?.email,
    partner_location: professionalProfile?.location || "",
    partner_photo_url: professionalProfile?.photo_url || "",
  };

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["partnerProducts", user?.email],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        { partner_company_email: user.email },
        "-created_date",
        100
      ),
    enabled: !!user?.email,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["partnerOrders", user?.email],
    queryFn: () =>
      base44.entities.ProductOrder.filter(
        { partner_company_email: user.email },
        "-created_date",
        50
      ),
    enabled: !!user?.email,
  });

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalNet = paidOrders.reduce((s, o) => s + (o.partner_net_amount || 0), 0);
  const pendingNet = orders
    .filter((o) => o.payment_status !== "paid" && o.status === "pending")
    .length;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ProductOrder.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerOrders"] });
      toast.success("Estado da encomenda atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar a encomenda"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      toast.success("Produto removido");
    },
  });

  const toggleAvailableMutation = useMutation({
    mutationFn: (product) =>
      base44.entities.PartnerProduct.update(product.id, { is_available: !product.is_available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
          <Euro className="w-4 h-4 text-emerald-400 mb-2" />
          <p className="text-lg font-black text-white">€{totalNet.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Líquido recebido</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
          <ShoppingBag className="w-4 h-4 text-orange-400 mb-2" />
          <p className="text-lg font-black text-white">{paidOrders.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Vendas pagas</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
          <Package className="w-4 h-4 text-sky-400 mb-2" />
          <p className="text-lg font-black text-white">{products.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Produtos ativos</p>
        </div>
      </div>

      {/* Toggle vista */}
      <div className="flex gap-1 bg-slate-900 border border-white/10 rounded-2xl p-1.5">
        {[
          { id: "products", label: "Produtos", icon: Package },
          { id: "orders", label: "Encomendas", icon: ShoppingBag },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-colors ${
              view === v.id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <v.icon className="w-4 h-4" />
            {v.label}
            {v.id === "orders" && paidOrders.filter((o) => o.status === "processing").length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {paidOrders.filter((o) => o.status === "processing").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Produtos */}
      {view === "products" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Publicar produto / serviço
          </button>

          {loadingProducts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-white/10 rounded-2xl">
              <PackageOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">Ainda não tens produtos na Loja</p>
              <p className="text-slate-500 text-xs mt-1 px-6">
                Publica ração, brinquedos, acessórios ou serviços avulsos — aparecem na vitrine pública do site.
              </p>
            </div>
          ) : (
            products.map((p) => {
              const delivery = DELIVERY[p.delivery_method] || DELIVERY.pickup;
              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-3.5 flex gap-3 items-center"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.product_name}</p>
                    <p className="text-xs text-slate-400">
                      €{(p.price_euro || 0).toFixed(2)} · {p.stock_quantity} em stock ·{" "}
                      <delivery.icon className="inline w-3 h-3 text-teal-400" /> {delivery.label}
                    </p>
                    <button
                      onClick={() => toggleAvailableMutation.mutate(p)}
                      className={`mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        p.is_available
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border-white/10"
                      }`}
                    >
                      {p.is_available ? "● À venda" : "○ Pausado"}
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar "${p.product_name}"?`)) deleteMutation.mutate(p.id);
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Encomendas */}
      {view === "orders" && (
        <div className="space-y-3">
          {loadingOrders ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-white/10 rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">Sem encomendas ainda</p>
              <p className="text-slate-500 text-xs mt-1 px-6">
                Quando um cliente comprar os teus produtos, a encomenda aparece aqui com o valor líquido.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const status = STATUS[order.status] || STATUS.pending;
              const items = (order.items || []).map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
              const delivery = DELIVERY[order.delivery_method] || DELIVERY.pickup;
              return (
                <div key={order.id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{items}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {order.order_number || ""} · {order.customer_name || order.customer_email}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <delivery.icon className="w-3.5 h-3.5 text-teal-400" />
                    {delivery.label}
                    {order.delivery_method === "shipping" && order.shipping_address && (
                      <span className="text-slate-500">
                        — {order.shipping_address.street}, {order.shipping_address.postal_code} {order.shipping_address.city}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 rounded-xl px-3 py-2 border border-white/5">
                    <span className="text-xs text-slate-400">
                      Total <span className="text-white font-bold">€{(order.total_amount || 0).toFixed(2)}</span>
                      {order.commission_amount > 0 && (
                        <span className="text-slate-500"> · comissão €{order.commission_amount.toFixed(2)}</span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Líquido €{(order.partner_net_amount || 0).toFixed(2)}
                    </span>
                  </div>

                  {order.payment_status === "paid" && order.status !== "delivered" && order.status !== "cancelled" && (
                    <div className="flex gap-2">
                      {order.delivery_method === "shipping" && order.status !== "shipped" && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: "shipped" })}
                          className="flex-1 h-9 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold transition-colors"
                        >
                          Marcar como enviado
                        </button>
                      )}
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: "delivered" })}
                        className="flex-1 h-9 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                      >
                        Marcar como entregue
                      </button>
                    </div>
                  )}
                  {order.payment_status !== "paid" && (
                    <p className="text-[11px] text-amber-400/80">
                      Aguarda pagamento do cliente — envia quando estiver pago.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {formOpen && (
        <PartnerProductForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          product={editing}
          partner={partner}
        />
      )}
    </div>
  );
}