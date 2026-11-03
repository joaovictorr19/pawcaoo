import React, { useEffect, useState } from "react";
import { promotionEndsAt } from "@/lib/promotions";

function formatLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `termina em ${d}d ${String(h).padStart(2, "0")}h`;
  if (h > 0) return `termina em ${h}h ${String(m).padStart(2, "0")}m`;
  return `termina em ${m}m ${String(s).padStart(2, "0")}s`;
}

// Contagem real até ao fim da promoção. Sem fim configurado, não inventa prazo.
export default function UrgencyCountdown({ promotion, fallback = "tempo limitado", className = "" }) {
  const endsAt = promotionEndsAt(promotion);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const remaining = endsAt - Date.now();
    if (remaining <= 0) return;
    const delay = remaining > 3600000 ? 30000 : 1000;
    const timer = setInterval(() => setNow(Date.now()), delay);
    return () => clearInterval(timer);
  }, [endsAt]);

  const remaining = endsAt ? endsAt - now : 0;
  return <span className={`tabular-nums ${className}`}>{remaining > 0 ? formatLeft(remaining) : fallback}</span>;
}