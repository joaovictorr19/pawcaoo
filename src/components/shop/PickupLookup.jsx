import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, PackageX, MapPin } from "lucide-react";
import PickupInfoBlock from "./PickupInfoBlock";

const STATUS_LABELS = {
  pending: "Aguarda pagamento",
  processing: "Em preparação",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export default function PickupLookup({ open, onClose }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Insere o código de recolha");
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const orders = await base44.entities.ProductOrder.filter({ pickup_code: c }, "-created_date", 5);
      if (!orders.length) {
        setError("Nenhuma encomenda encontrada com esse código");
      } else {
        setResult(orders[0]);
      }
    } catch (e) {
      setError("Não foi possível procurar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-3xl">
        <DialogHeader className="p-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold text-slate-900">
            <MapPin className="w-5 h-5 text-teal-600" /> Procurar Recolha
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Insere o código de recolha (ex: REC-XXXX) para veres onde e quando levantar a tua encomenda.
          </p>
        </DialogHeader>
        <div className="px-5 pb-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="REC-XXXX"
                autoCapitalize="characters"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="h-11 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Procurar
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <PackageX className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Encomenda</p>
                <p className="text-sm font-bold text-slate-900">{result.order_number}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {result.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}
                </p>
                <p className="text-xs text-slate-500">Parceiro: {result.partner_name}</p>
                <p className="text-xs font-semibold text-teal-700 mt-1">
                  {STATUS_LABELS[result.status] || result.status}
                </p>
              </div>
              <PickupInfoBlock
                code={result.pickup_code}
                address={result.pickup_address}
                city={result.pickup_city}
                postal_code={result.pickup_postal_code}
                notes={result.pickup_notes}
                schedule={result.pickup_schedule}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}