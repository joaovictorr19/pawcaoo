import React from "react";
import { Check } from "lucide-react";

const STEPS = [
  { key: "paid", shipping: "Pago", local: "Pago" },
  { key: "processing", shipping: "Em preparação", local: "Em preparação" },
  { key: "shipped", shipping: "Enviado", local: "Pronta" },
  { key: "delivered", shipping: "Entregue", local: "Recolhida" },
];

const PROGRESS = { pending: -1, paid: 0, processing: 1, shipped: 2, delivered: 3 };

export default function OrderStatusTimeline({ status, deliveryMethod = "shipping" }) {
  const current = PROGRESS[status] ?? -1;
  if (current < 0) return null;

  const isShipping = deliveryMethod === "shipping";

  return (
    <div className="flex items-start mt-4">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const label = isShipping ? step.shipping : step.local;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div
                className={`h-0.5 flex-1 ${
                  i === 0 ? "bg-transparent" : done ? "bg-teal-500" : "bg-slate-200"
                }`}
              />
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                  done
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-slate-300 text-slate-300"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
              </div>
              <div
                className={`h-0.5 flex-1 ${
                  i === STEPS.length - 1
                    ? "bg-transparent"
                    : i < current
                      ? "bg-teal-500"
                      : "bg-slate-200"
                }`}
              />
            </div>
            <p
              className={`text-[9px] font-bold mt-1.5 text-center leading-tight ${
                done ? "text-teal-700" : "text-slate-400"
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}