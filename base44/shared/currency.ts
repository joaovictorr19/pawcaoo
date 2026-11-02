/**
 * Conversão de moeda no backend.
 * A cobrança só está confirmada em EUR — qualquer produto noutra moeda é
 * convertido para EUR no momento do checkout e o valor aplicado é guardado
 * na encomenda. Se a taxa não estiver disponível, o checkout falha em vez de
 * cobrar um valor inventado.
 */

export const CHARGE_CURRENCY = 'EUR';

const RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let cache: { rates: Record<string, number>; at: number } | null = null;

async function loadRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rates;

  try {
    const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rates = { EUR: 1, ...(data?.rates || {}) } as Record<string, number>;
    cache = { rates, at: Date.now() };
    return rates;
  } catch (e) {
    console.warn('Exchange rates unavailable:', (e as Error)?.message || e);
    return cache?.rates || { EUR: 1 };
  }
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Converte um valor para a moeda de cobrança (EUR).
 * Devolve null quando não existe taxa para a moeda de origem.
 */
export async function convertToCharge(
  amount: number,
  fromCurrency: string,
): Promise<{ amount: number; currency: string; rate: number } | null> {
  const value = round2(Number(amount) || 0);
  const from = fromCurrency || CHARGE_CURRENCY;
  if (from === CHARGE_CURRENCY) return { amount: value, currency: CHARGE_CURRENCY, rate: 1 };

  const rates = await loadRates();
  const perEuro = Number(rates[from]);
  if (!perEuro || perEuro <= 0) return null;

  const rate = 1 / perEuro; // valor em EUR por 1 unidade da moeda de origem
  return {
    amount: round2(value * rate),
    currency: CHARGE_CURRENCY,
    rate: Math.round(rate * 1000000) / 1000000,
  };
}