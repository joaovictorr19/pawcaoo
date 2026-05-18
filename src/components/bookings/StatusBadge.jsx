import React from "react";

export default function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
    confirmed: { label: 'Confirmado', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
    in_progress: { label: 'Em Andamento', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
    service_completed: { label: 'Serviço Feito', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
    completed: { label: 'Concluído', color: 'bg-slate-600/40 text-slate-300 border border-slate-600/40' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
    rejected: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${config.color}`}>{config.label}</span>;
}