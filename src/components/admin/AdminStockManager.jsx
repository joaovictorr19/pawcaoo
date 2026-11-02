import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Search, Package, PackageX, AlertTriangle } from "lucide-react";
import StockProductRow from "./StockProductRow";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "low", label: "Stock baixo" },
  { id: "out", label: "Sem stock" },
];

const stockOf = (p) => Math.max(0, Number(p.stock_quantity) || 0);

function SummaryCard({ label, value, Icon, tone }) {
  const tones = {
    slate: "bg-white text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone]}`}>
      <Icon className="w-4 h-4 mb-1.5 opacity-70" />
      <p className="font-heading font-extrabold text-xl leading-none">{value}</p>
      <p className="text-[10px] font-semibold mt-1 leading-tight opacity-80">{label}</p>
    </div>
  );
}

export default function AdminStockManager({ products = [], isLoading = false }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [threshold, setThreshold] = useState(10);

  const counts = useMemo(
    () => ({
      total: products.length,
      low: products.filter((p) => stockOf(p) > 0 && stockOf(p) <= threshold).length,
      out: products.filter((p) => stockOf(p) === 0).length,
    }),
    [products, threshold]
  );

  const visible = useMemo(
    () =>
      products.filter((p) => {
        const stock = stockOf(p);
        if (filter === "low" && !(stock > 0 && stock <= threshold)) return false;
        if (filter === "out" && stock !== 0) return false;
        if (search) {
          const hay = `${p.product_name || ""} ${p.partner_name || ""}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [products, filter, threshold, search]
  );

  const saveMutation = useMutation({
    mutationFn: ({ id, quantity }) =>
      base44.entities.PartnerProduct.update(id, { stock_quantity: quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPartnerProducts"] });
      toast.success("Stock atualizado");
    },
    onError: () => toast.error("Não foi possível guardar o stock"),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <SummaryCard label="Produtos" value={counts.total} Icon={Package} tone="slate" />
        <SummaryCard label={`Stock baixo (≤${threshold})`} value={counts.low} Icon={AlertTriangle} tone="amber" />
        <SummaryCard label="Sem stock" value={counts.out} Icon={PackageX} tone="rose" />
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar produto ou parceiro..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 h-9 rounded-full text-[12px] font-semibold border transition-colors ${
                filter === f.id
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {f.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            Limite
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold text-slate-700 bg-white"
            >
              {[3, 5, 10, 20].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-12 text-center">
          <PackageX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Nenhum produto nesta vista</p>
          <p className="text-xs text-slate-500 mt-1">Ajusta o filtro ou o limite de stock baixo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((product) => (
            <StockProductRow
              key={product.id}
              product={product}
              threshold={threshold}
              isSaving={saveMutation.isPending && saveMutation.variables?.id === product.id}
              onSave={(quantity) => saveMutation.mutate({ id: product.id, quantity })}
            />
          ))}
        </div>
      )}
    </div>
  );
}