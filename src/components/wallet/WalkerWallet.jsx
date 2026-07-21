import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, Wallet, CalendarDays, TrendingUp, DollarSign, 
  Clock, CheckCircle, ExternalLink, Settings, AlertTriangle, Loader2 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function WalkerWallet({ walkerEmail }) {
  const queryClient = useQueryClient();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: walkerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['walkerProfile', walkerEmail],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: walkerEmail });
      return profiles[0];
    },
    enabled: !!walkerEmail,
  });

  const { data: completedBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['walkerEarnings', walkerEmail],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({
        walker_email: walkerEmail,
        status: { $in: ['completed', 'service_completed'] }
      }, '-completed_date', 50);
      return bookings || [];
    },
    enabled: !!walkerEmail,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['walkerPayouts', walkerEmail],
    queryFn: async () => {
      const records = await base44.entities.WalkerPayout.filter({ walker_email: walkerEmail }, '-created_date', 100);
      return records || [];
    },
    enabled: !!walkerEmail,
  });

  const availableBalance = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.net_amount || 0), 0);

  const todayEarnings = completedBookings
    .filter(b => {
      if (!b.completed_date) return false;
      const today = new Date().toDateString();
      return new Date(b.completed_date).toDateString() === today;
    })
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  const weekEarnings = completedBookings
    .filter(b => {
      if (!b.completed_date) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(b.completed_date) >= weekAgo;
    })
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount || '0');
    if (!amount || amount <= 0 || amount > availableBalance) return;
    setIsWithdrawing(true);

    try {
      const iban = walkerProfile?.bank_account_number;
      if (!iban) {
        toast.error('Adicione o seu IBAN primeiro');
        return;
      }
      const response = await base44.functions.invoke('requestWalletWithdrawal', {
        amount, iban
      });
      if (response?.data?.success) {
        toast.success('Pedido de saque enviado');
        setWithdrawAmount('');
        queryClient.invalidateQueries({ queryKey: ['walkerPayouts'] });
        queryClient.invalidateQueries({ queryKey: ['walkerEarnings'] });
      } else {
        throw new Error(response?.data?.error || 'Erro ao processar');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Erro ao processar levantamento');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSetupStripe = async () => {
    setIsSettingUp(true);
    try {
      // Use onboarding link which handles both creation and login
      const response = await base44.functions.invoke('createStripeOnboardingLink', {
        return_url: window.location.href
      });
      
      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Erro ao conectar com Stripe");
      }
    } catch (error) {
      toast.error("Erro ao iniciar configuração");
    } finally {
      setIsSettingUp(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  if (profileLoading || bookingsLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Minha Carteira</h1>

      {/* WARNING IF NO STRIPE */}
      {walkerProfile && !walkerProfile.stripe_account_id && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-orange-900">Configure os Pagamentos</h3>
                <p className="text-sm text-orange-800 mt-1 mb-3">
                  Para receber seus ganhos, você precisa conectar uma conta bancária via Stripe.
                </p>
                <Button 
                  size="sm" 
                  onClick={handleSetupStripe} 
                  disabled={isSettingUp}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-0"
                >
                  {isSettingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Configurar Stripe"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN BALANCE CARD */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-slate-300 text-sm font-medium mb-1">Saldo Disponível</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold">{formatCurrency(availableBalance)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 w-full">
                <input
                  type="number"
                  min="0.5"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Valor do saque"
                  className="w-full h-12 rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/50 outline-none"
                />
                <Button 
                  onClick={handleWithdraw}
                  disabled={availableBalance <= 0 || isWithdrawing}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-900/30"
                >
                  {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowUpRight className="mr-2 h-5 w-5" /> Solicitar Saque</>}
                </Button>
              </div>
              
              <Button 
                onClick={handleSetupStripe}
                variant="outline"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium h-12 rounded-xl backdrop-blur-sm"
              >
                <Settings className="mr-2 h-5 w-5" /> {walkerProfile?.stripe_account_id ? "Dashboard" : "Configurar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <CalendarDays size={16} />
              <span className="text-xs font-semibold">Hoje</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(todayEarnings)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold">Esta Semana</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(weekEarnings)}</p>
          </CardContent>
        </Card>
      </div>

      {/* TRANSACTION HISTORY */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum passeio completado ainda</p>
            </div>
          ) : (
            completedBookings.slice(0, 10).map((booking) => {
              const total = (booking.service_amount || 0) + (booking.tip_amount || 0);
              const isPaid = booking.payment_status === 'released';
              
              return (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {isPaid ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-yellow-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{booking.dog_name || 'Passeio'}</p>
                      <p className="text-xs text-gray-500">{formatDate(booking.completed_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>+{formatCurrency(total)}</p>
                    <p className="text-[10px] text-gray-400">{isPaid ? 'Pago' : 'Pendente'}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}