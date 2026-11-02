import React from "react";
import { useLocalization } from "@/components/LocalizationContext";
import { formatMoney } from "@/lib/currency";

const SIZES = {
  sm: { main: "text-sm font-black", note: "text-[9px]" },
  md: { main: "text-lg sm:text-xl font-black", note: "text-[10px]" },
  lg: { main: "text-2xl font-black", note: "text-[11px]" },
};

/**
 * Preço de um produto na moeda da localização atual.
 * O preço base (definido pelo parceiro) fica sempre visível quando há conversão,
 * e a conversão é apresentada como estimativa.
 */
export default function ShopPrice({ product, size = "md" }) {
  const { country, convertCurrency } = useLocalization();
  const s = SIZES[size] || SIZES.md;

  const base = Number(product?.price_euro) || 0;
  const baseCurrency = product?.price_currency || "EUR";
  const displayCurrency = country?.currency || "EUR";
  const isConverted = baseCurrency !== displayCurrency;
  const converted = isConverted ? convertCurrency(base, baseCurrency, displayCurrency) : base;

  const primary = formatMoney(converted ?? base, converted === null ? baseCurrency : displayCurrency);

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={`${s.main} text-teal-700 leading-none`}>
        {converted !== null && isConverted ? `≈ ${primary}` : primary}
      </span>
      {isConverted && converted !== null && (
        <span className={`${s.note} font-semibold text-slate-400 mt-0.5`}>
          Base: {formatMoney(base, baseCurrency)}
        </span>
      )}
      {isConverted && converted === null && (
        <span className={`${s.note} font-semibold text-amber-600 mt-0.5`}>Câmbio indisponível</span>
      )}
    </span>
  );
}