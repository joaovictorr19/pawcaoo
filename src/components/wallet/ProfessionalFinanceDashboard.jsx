import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, startOfMonth, eachDayOfInterval, subMonths, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";

const TYPE_LABELS = {
  walker_payment_completed: "Pagamento recebido",
  walker_payment_pending: "Pagamento pendente",
  cashback_earned: "Cashback ganho",
  cashback_used: "Cashback usado",
  escrow_released: "Escrow libertado",
  escrow_reserved: "Reserva",
  surcharge_paid: "Sobretaxa",
  token_credited: "Token creditado",
  token_used: "Token usado",
  points_earned: "Pontos ganhos",
  points_redeemed: "Pontos usados",
};

const INCOME_TYPES = ["walker_payment_completed", "cashback_earned", "escrow_released", "token_credited"];
const OUTCOME_TYPES = ["cashback_used", "escrow_reserved", "surcharge_paid", "token_used", "points_redeemed"];

export default function ProfessionalFinanceDashboard({ userEmail }) {
  const [view, setView] = useState("daily"); // "daily" | "monthly"

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["walletTransactions", userEmail],
    queryFn: () =>
      base44.entities.WalletTransaction.filter({ user_email: userEmail }, "-created_date", 200),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  });

  // Saldo atual = último balance_after disponível, ou soma manual
  const currentBalance = useMemo(() => {
    const withBalance = transactions.filter((t) => t.balance_after != null);
    if (withBalance.length > 0) return withBalance[0].balance_after;
    return transactions.reduce((sum, t) => {
      if (INCOME_TYPES.includes(t.transaction_type)) return sum + (t.amount || 0);
      if (OUTCOME_TYPES.includes(t.transaction_type)) return sum - (t.amount || 0);
      return sum;
    }, 0);
  }, [transactions]);

  // Total ganho (apenas recebimentos)
  const totalEarned = useMemo(() =>
    transactions
      .filter((t) => INCOME_TYPES.includes(t.transaction_type))
      .reduce((s, t) => s + (t.amount || 0), 0),
    [transactions]
  );

  // Gráfico diário — últimos 14 dias
  const dailyData = useMemo(() => {
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() - 13);
    return eachDayOfInterval({ start, end: today }).map((day) => ({
      label: format(day, "dd/MM"),
      value: transactions
        .filter((t) => INCOME_TYPES.includes(t.transaction_type) && isSameDay(new Date(t.created_date), day))
        .reduce((s, t) => s + (t.amount || 0), 0),
    }));
  }, [transactions]);

  // Gráfico mensal — últimos 6 meses
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const key = format(month, "yyyy-MM");
      return {
        label: format(month, "MMM", { locale: pt }),
        value: transactions
          .filter((t) =>
            INCOME_TYPES.includes(t.transaction_type) &&
            t.created_date?.startsWith(key)
          )
          .reduce((s, t) => s + (t.amount || 0), 0),
      };
    });
  }, [transactions]);

  const chartData = view === "daily" ? dailyData : monthlyData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} />
            <span className="text-xs font-bold uppercase tracking-wide opacity-80">Saldo</span>
          </div>
          <p className="text-2xl font-black">€{currentBalance.toFixed(2)}</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wide opacity-80">Total Ganho</span>
          </div>
          <p className="text-2xl font-black">€{totalEarned.toFixed(2)}</p>
        </Card>
      </div>

      {/* Gráfico */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-wide text-slate-700">Rendimentos</h3>
          <div className="flex gap-1">
            {["daily", "monthly"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                  view === v
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {v === "daily" ? "Diário" : "Mensal"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={view === "daily" ? 12 : 28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
            <Tooltip
              formatter={(v) => [`€${v.toFixed(2)}`, "Ganhos"]}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            />
            <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Histórico */}
      <Card className="p-4">
        <h3 className="font-black text-sm uppercase tracking-wide text-slate-700 mb-3">Histórico</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-8">Sem transações ainda.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {transactions.map((t) => {
              const isIncome = INCOME_TYPES.includes(t.transaction_type);
              const isPending = t.transaction_type === "walker_payment_pending";
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isPending ? "bg-yellow-100" : isIncome ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {isPending
                      ? <Clock size={14} className="text-yellow-600" />
                      : isIncome
                      ? <ArrowDownLeft size={14} className="text-green-600" />
                      : <ArrowUpRight size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {TYPE_LABELS[t.transaction_type] || t.transaction_type}
                    </p>
                    {t.description && (
                      <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {t.created_date ? format(new Date(t.created_date), "dd MMM yyyy, HH:mm", { locale: pt }) : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${
                      isPending ? "text-yellow-600" : isIncome ? "text-green-600" : "text-red-500"
                    }`}>
                      {isIncome ? "+" : "-"}€{(t.amount || 0).toFixed(2)}
                    </p>
                    {t.balance_after != null && (
                      <p className="text-[10px] text-slate-400">Saldo: €{t.balance_after.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}