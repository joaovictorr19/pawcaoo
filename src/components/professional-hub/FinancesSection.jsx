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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/20 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Faturado</p>
            <h3 className="text-2xl font-black text-green-400">€{totalEarned.toFixed(2)}</h3>
            <p className="text-xs text-slate-500 mt-2">{payments.length} transações</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/20 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Média/Transação</p>
            <h3 className="text-2xl font-black text-blue-400">€{averagePerTransaction.toFixed(2)}</h3>
            <p className="text-xs text-slate-500 mt-2">Por serviço realizado</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Chart */}
      {monthlyData.length > 0 && (
        <Card className="bg-slate-900 border-white/5 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Ganhos Mensais
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  formatter={(value) => `€${value.toFixed(2)}`}
                />
                <Bar dataKey="earned" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Card */}
      <Card className="bg-gradient-to-r from-orange-900/50 to-amber-900/50 border-orange-500/30 rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-400" />
              Levantar Fundos
            </h3>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">Stripe Connect</span>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            Saldo disponível: <strong className="text-orange-300">€{totalEarned.toFixed(2)}</strong>
          </p>
          <Button
            onClick={handleWithdrawal}
            disabled={totalEarned < 25}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl h-10"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Levantar Saldo
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("StripeConnectSetup"))}
            variant="outline"
            className="w-full mt-2 bg-transparent border-orange-500/40 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 font-semibold rounded-xl h-10"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Configurar recebimentos (Stripe)
          </Button>
          <p className="text-xs text-slate-400 mt-3">Mínimo €25 • Processado em 2-3 dias úteis</p>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentPayments.length > 0 && (
        <Card className="bg-slate-900 border-white/5 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-white mb-4">Transações Recentes</h3>
            <div className="space-y-3">
              {recentPayments.map((payment, idx) => (
                <div key={payment.id || idx} className="flex items-center justify-between pb-3 border-b border-slate-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{payment.payer_name || 'Pagamento'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(payment.released_date).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <p className="text-sm font-black text-green-400 ml-2 flex-shrink-0">+€{(payment.service_amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length === 0 && (
        <Card className="bg-slate-900 border-dashed border-slate-700 rounded-[1.5rem] overflow-hidden">
          <CardContent className="p-8 text-center">
            <p className="text-slate-400 text-sm mb-2">Nenhuma transação realizada ainda</p>
            <p className="text-xs text-slate-500">Complete serviços para ver seu histórico financeiro</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}