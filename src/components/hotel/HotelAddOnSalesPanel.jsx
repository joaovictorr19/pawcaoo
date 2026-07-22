import React, { useMemo, useState } from "react";
import {
  Package, Search,
  CheckCircle2, Clock, XCircle, ShoppingBag, HeartHandshake,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const SERVICE_LABELS = {
  bathing: "Banho", grooming: "Grooming", walk: "Passeio", training: "Treino",
  nail_trim: "Corte de Unhas", feeding: "Alimentação", medication: "Medicação",
  playtime: "Brincadeira", general_care: "Cuidados Gerais",
  pet_food: "Ração", treats: "Petiscos", toys: "Brinquedos",
  accessories: "Acessórios", bed: "Cama", hygiene: "Higiene", other_product: "Produto",
};

const PAY_BADGE = {
  paid: { label: "Pago", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  pending: { label: "Pendente", cls: "bg-amber-100 text-amber-700", icon: Clock },
  unpaid: { label: "Por cobrar", cls: "bg-slate-100 text-slate-500", icon: XCircle },
};

function getPayBadge(addOn) {
  if (addOn.payment_status === "paid" || addOn.paid) return PAY_BADGE.paid;
  if (addOn.payment_status === "pending") return PAY_BADGE.pending;
  return PAY_BADGE.unpaid;
}

export default function HotelAddOnSalesPanel({ bookings }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | product | service

  const sales = useMemo(() => {
    const items = [];
    for (const b of bookings) {
      if (["cancelled", "rejected"].includes(b.status)) continue;
      const dogNames = (b.dogs || []).map(d => d.dog_name).join(", ") || "—";
      for (const [idx, addOn] of (b.add_ons || []).entries()) {
        items.push({
          key: `${b.id}-${idx}`,
          bookingId: b.id,
          serviceName: addOn.service_name,
          label: SERVICE_LABELS[addOn.service_name] || addOn.service_name,
          itemName: addOn.item_name,
          category: addOn.item_category || (["pet_food","treats","toys","accessories","bed","hygiene","other_product"].includes(addOn.service_name) ? "product" : "service"),
          quantity: addOn.quantity || 1,
          pricePerUnit: addOn.price_per_unit || 0,
          total: addOn.total_price || 0,
          commission: addOn.commission_amount || 0,
          net: addOn.hotel_net_amount != null ? addOn.hotel_net_amount : (addOn.total_price || 0) - (addOn.commission_amount || 0),
          paymentStatus: addOn.payment_status || (addOn.paid ? "paid" : "unpaid"),
          paidAt: addOn.paid_at,
          paymentMethod: addOn.payment_method,
          ownerName: b.owner_name,
          ownerEmail: b.owner_email,
          dogNames,
          checkinDate: b.checkin_date,
          completed: addOn.completed,
        });
      }
    }
    return items.sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""));
  }, [bookings]);

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.dogNames?.toLowerCase().includes(q) ||
      s.label?.toLowerCase().includes(q) ||
      s.itemName?.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || s.category === filter;
    return matchesSearch && matchesFilter;
  });

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, x) => s + x.total, 0);
    const commission = filtered.reduce((s, x) => s + x.commission, 0);
    const net = filtered.reduce((s, x) => s + x.net, 0);
    const paid = filtered.filter(x => x.paymentStatus === "paid").reduce((s, x) => s + x.net, 0);
    return { gross, commission, net, paid };
  }, [filtered]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-5 pb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Vendas de Produtos & Serviços</h3>
          <p className="text-[10px] text-slate-400">Histórico de extras vendidos durante estadias</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-5 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Vendas Brutas</p>
          <p className="text-sm font-black text-slate-900">{totals.gross.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Comissão</p>
          <p className="text-sm font-black text-rose-600">{totals.commission.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Líquido Total</p>
          <p className="text-sm font-black text-emerald-600">{totals.net.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Já Recebido</p>
          <p className="text-sm font-black text-teal-600">{totals.paid.toFixed(2)}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar cliente, cão ou item..."
            className="pl-8 h-8 text-xs rounded-lg"
          />
        </div>
        <div className="flex gap-1">
          {[
            { v: "all", l: "Tudo" },
            { v: "product", l: "Produtos" },
            { v: "service", l: "Serviços" },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`h-8 px-2.5 text-[11px] font-semibold rounded-lg border transition-all ${
                filter === f.v ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-5 pb-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Ainda sem vendas</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Adiciona serviços ou produtos a estadias ativas para ver aqui o histórico.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2">Item</th>
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden sm:table-cell">Cliente</th>
                <th className="text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden md:table-cell">Cão</th>
                <th className="text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden lg:table-cell">Qtd</th>
                <th className="text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Total</th>
                <th className="text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden sm:table-cell">Líquido</th>
                <th className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const Icon = s.category === "product" ? Package : HeartHandshake;
                const pb = getPayBadge(s);
                const PIcon = pb.icon;
                return (
                  <tr key={s.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          s.category === "product" ? "bg-blue-50" : "bg-teal-50"
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${s.category === "product" ? "text-blue-500" : "text-teal-500"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {s.itemName || s.label}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {s.category === "product" ? "Produto" : "Serviço"} · {s.label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{s.ownerName || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <p className="text-xs text-slate-500 truncate max-w-[80px]">{s.dogNames}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden lg:table-cell">
                      <span className="text-xs font-medium text-slate-500">{s.quantity}×</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-xs font-bold text-slate-900">{s.total.toFixed(2)}€</span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                      <span className="text-xs font-bold text-emerald-600">{s.net.toFixed(2)}€</span>
                      {s.commission > 0 && (
                        <p className="text-[8px] text-slate-400">-{s.commission.toFixed(2)}€</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${pb.cls}`}>
                        <PIcon className="w-2.5 h-2.5" />
                        {pb.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}