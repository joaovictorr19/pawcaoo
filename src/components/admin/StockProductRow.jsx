import React, { useEffect, useState } from "react";
import { Minus, Plus, Check, Loader2, Package } from "lucide-react";
import { formatMoney } from "@/lib/currency";

export default function StockProductRow({ product, threshold, onSave, isSaving }) {
  const current = Math.max(0, Number(product.stock_quantity) || 0);
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const changed = Number(value) !== current;
  const isOut = current === 0;
  const isLow = current > 0 && current <= threshold;
  const step = (delta) => setValue(Math.max(0, (Number(value) || 0) + delta));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 leading-tight truncate">{product.product_name}</p>
          <p className="text-[11px] text-slate-500 truncate">{product.partner_name || "Parceiro"}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOut
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isLow
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-teal-50 text-teal-700 border-teal-200"
              }`}
            >
              {isOut ? "Sem stock" : isLow ? `Stock baixo · ${current} un.` : `${current} un.`}
            </span>
            {product.is_available === false && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Inativo
              </span>
            )}
            {!!product.price_euro && (
              <span className="text-[11px] font-semibold text-slate-500">
                {formatMoney(product.price_euro, product.price_currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => step(-1)}
          aria-label="Diminuir stock"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          aria-label={`Stock de ${product.product_name}`}
          value={value}
          onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
          className="h-9 w-20 rounded-xl border border-slate-200 bg-white text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
        <button
          onClick={() => step(1)}
          aria-label="Aumentar stock"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSave(Number(value))}
          disabled={!changed || isSaving}
          className="ml-auto h-9 px-3.5 rounded-xl bg-teal-600 text-white text-[11px] font-bold flex items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Guardar
        </button>
      </div>
    </div>
  );
}