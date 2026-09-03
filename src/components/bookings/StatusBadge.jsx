import React from "react";

export default function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-800' },
    in_progress: { label: 'Em Andamento', color: 'bg-orange-100 text-orange-800' },
    service_completed: { label: 'Serviço Feito', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Concluído', color: 'bg-slate-100 text-slate-600' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${config.color}`}>{config.label}</span>;
}