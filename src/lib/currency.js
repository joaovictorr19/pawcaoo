export const CURRENCIES = {
  EUR: { code: "EUR", symbol: "€", locale: "pt-PT", label: "Euro (EUR)" },
  BRL: { code: "BRL", symbol: "R$", locale: "pt-BR", label: "Real brasileiro (BRL)" },
  USD: { code: "USD", symbol: "$", locale: "en-US", label: "Dólar (USD)" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", label: "Libra (GBP)" },
};

/** Moedas em que um produto pode ter o preço definido */
export const PRODUCT_CURRENCIES = ["EUR", "BRL"];

/** Moeda em que a cobrança está efetivamente confirmada (Stripe) */
export const CHARGE_CURRENCY = "EUR";

export function getCurrency(code) {
  return CURRENCIES[code] || CURRENCIES.EUR;
}

export function formatMoney(amount, currency = "EUR") {
  const cfg = getCurrency(currency);
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}