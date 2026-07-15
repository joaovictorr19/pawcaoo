import React from "react";
import {
  Zap, Star, Lock, Unlock, ArrowDownLeft, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle, Gift, Euro
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const TX_CONFIG = {
  cashback_earned:           { icon: ArrowDownLeft,  color: "text-emerald-600", bg: "bg-emerald-50", sign: "+", label: "Cashback" },
  cashback_used:             { icon: ArrowUpRight,    color: "text-rose-500",    bg: "bg-rose-50",    sign: "-", label: "Cashback usado" },
  token_credited:            { icon: Zap,             color: "text-orange-500",  bg: "bg-orange-50",  sign: "",  label: "Token creditado", token: true },
  token_used:                { icon: Zap,             color: "text-slate-400",   bg: "bg-slate-100",  sign: "",  label: "Token usado", token: true },
  token_expired:             { icon: AlertCircle,     color: "text-red-400",     bg: "bg-red-50",     sign: "",  label: "Token expirado", token: true },
  points_earned:             { icon: Star,            color: "text-amber-500",   bg: "bg-amber-50",   sign: "+", label: "Pontos ganhos", points: true },
  points_redeemed:           { icon: Gift,            color: "text-purple-500",  bg: "bg-purple-50",  sign: "-", label: "Pontos trocados", points: true },
  escrow_reserved:           { icon: Lock,            color: "text-blue-500",    bg: "bg-blue-50",    sign: "-", label: "Cofre reservado" },
  escrow_released:           { icon: Unlock,          color: "text-emerald-500", bg: "bg-emerald-50", sign: "+", label: "Cofre libertado" },
  surcharge_paid:            { icon: Euro,            color: "text-rose-500",    bg: "bg-rose-50",    sign: "-", label: "Sobretaxa paga" },
  walker_payment_pending:    { icon: Clock,           color: "text-amber-500",   bg: "bg-amber-50",   sign: "+", label: "Pagamento pendente" },
  walker_payment_completed:  { icon: CheckCircle2,    color: "text-emerald-500", bg: "bg-emerald-50", sign: "+", label: "Pagamento concluído" },
};

export default function TransactionItem({ tx }) {
  const cfg = TX_CONFIG[tx.transaction_type] || { icon: Euro, color: "text-slate-400", bg: "bg-slate-100", sign: "", label: "Transação" };
  const Icon = cfg.icon;

  const isPositive = cfg.sign === "+";
  const isNeutral = cfg.sign === "";
  const displayAmount = cfg.token
    ? `${tx.tokens_amount || 0} tok`
    : cfg.points
    ? `${tx.points_amount || 0} pts`
    : `€${(tx.amount || 0).toFixed(2)}`;

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{tx.description || cfg.label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {format(new Date(tx.created_date), "dd MMM yyyy, HH:mm", { locale: pt })}
          {tx.balance_after != null && !cfg.token && !cfg.points && (
            <span className="ml-2 text-slate-300">· Saldo: €{tx.balance_after.toFixed(2)}</span>
          )}
        </p>
      </div>
      <p className={`text-sm font-bold flex-shrink-0 ${isNeutral ? "text-slate-500" : isPositive ? "text-emerald-600" : "text-rose-500"}`}>
        {cfg.sign}{displayAmount}
      </p>
    </div>
  );
}