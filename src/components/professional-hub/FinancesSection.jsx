import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Loader2, CreditCard, ArrowUpRight, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function FinancesSection({ user, professionalProfile }) {
  const navigate = useNavigate();
  // Fetch all completed payments for this professional
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['professionalPayments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const allPayments = await base44.entities.Payment.filter({
          recipient_email: user.email,
          status: 'released'
        }, '-released_date', 100);
        return Array.isArray(allPayments) ? allPayments : [];
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    },
    enabled: !!user?.email
  });

  // Aggregate monthly data
  const monthlyData = useMemo(() => {
    if (payments.length === 0) return [];
    
    const grouped = {};
    payments.forEach(payment => {
      const date = new Date(payment.released_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: monthKey, earned: 0, count: 0 };
      }
      grouped[monthKey].earned += payment.service_amount || 0;
      grouped[monthKey].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
        earned: Math.round(item.earned * 100) / 100,
        count: item.count
      }));
  }, [payments]);

  const totalEarned = payments.reduce((sum, p) => sum + (p.service_amount || 0), 0);
  const averagePerTransaction = payments.length > 0 ? totalEarned / payments.length : 0;
  const recentPayments = payments.slice(0, 5);

  const handleWithdrawal = () => {
    if (totalEarned < 25) {
      toast.info("Saldo mínimo de €25 necessário para levantar");
      return;
    }
    toast.success("Pedido de levantamento enviado! Receberá em 2-3 dias úteis.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Faturado</p>
          <h3 className="text-2xl font-black text-emerald-600">€{totalEarned.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-2">{payments.length} transações</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Média/Transação</p>
          <h3 className="text-2xl font-black text-blue-600">€{averagePerTransaction.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-2">Por serviço realizado</p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Ganhos Mensais
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                formatter={(value) => `€${value.toFixed(2)}`}
              />
              <Bar dataKey="earned" fill="#0d9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Withdrawal Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Levantar Fundos
          </h3>
          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Stripe Connect</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Saldo disponível: <strong className="text-slate-900">€{totalEarned.toFixed(2)}</strong>
        </p>
        <Button
          onClick={handleWithdrawal}
          disabled={totalEarned < 25}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl h-10"
        >
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Levantar Saldo
        </Button>
        <Button
          onClick={() => navigate(createPageUrl("StripeConnectSetup"))}
          variant="outline"
          className="w-full mt-2 bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl h-10"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configurar recebimentos (Stripe)
        </Button>
        <p className="text-xs text-slate-400 mt-3">Mínimo €25 • Processado em 2-3 dias úteis</p>
      </div>

      {/* Recent Transactions */}
      {recentPayments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">Transações Recentes</h3>
          <div className="space-y-3">
            {recentPayments.map((payment, idx) => (
              <div key={payment.id || idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{payment.payer_name || 'Pagamento'}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(payment.released_date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <p className="text-sm font-black text-emerald-600 ml-2 flex-shrink-0">+€{(payment.service_amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div className="bg-white border-dashed border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-slate-400 text-sm mb-2">Nenhuma transação realizada ainda</p>
          <p className="text-xs text-slate-400">Complete serviços para ver seu histórico financeiro</p>
        </div>
      )}
    </div>
  );
}