import React from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  pending:  { icon: Clock,         label: "Pendente",    color: "text-amber-600",  bg: "bg-amber-50",  dot: "bg-amber-400" },
  approved: { icon: Loader2,       label: "Aprovado",    color: "text-blue-600",   bg: "bg-blue-50",   dot: "bg-blue-400" },
  paid:     { icon: CheckCircle2,  label: "Pago",        color: "text-emerald-600",bg: "bg-emerald-50",dot: "bg-emerald-400" },
  rejected: { icon: XCircle,       label: "Rejeitado",   color: "text-rose-500",   bg: "bg-rose-50",   dot: "bg-rose-400" },
};

export default function WithdrawalHistory({ withdrawals = [] }) {
  if (withdrawals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Histórico de Saques</h3>
        <div className="py-8 text-center">
          <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">Nenhum saque solicitado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Histórico de Saques</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {withdrawals.map((w) => {
          const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <div key={w.id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color} ${w.status === 'approved' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">€{(w.amount || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {format(new Date(w.created_date), "dd/MM/yyyy HH:mm", { locale: pt })} · {w.iban?.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}