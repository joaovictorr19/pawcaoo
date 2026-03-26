import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  DollarSign, Clock, CheckCircle, AlertCircle, Download, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MyWalletPro() {
  const queryClient = useQueryClient();
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [credits, setCredits] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch professional wallet
  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['professionalWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ 
        user_email: user.email 
      });
      return wallets[0] || {
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        monthly_earnings: 0
      };
    },
    enabled: !!user?.email,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions', user?.email],
    queryFn: () => base44.entities.WalletTransaction.filter({ 
      user_email: user.email 
    }, '-created_date', 30),
    enabled: !!user?.email,
  });

  // Mutation: Add credits via Stripe
  const addCreditsMutation = useMutation({
    mutationFn: async (amount) => {
      const session = await base44.functions.invoke('createStripeCheckout', {
        productName: `Créditos PawCão - €${amount}`,
        amount: Math.round(amount * 100),
        quantity: 1,
        walletTopup: true,
      });
      return session;
    },
    onSuccess: (session) => {
      if (session?.url) {
        window.location.href = session.url;
      } else {
        toast.error('Erro ao gerar link de pagamento');
      }
    },
    onError: () => {
      toast.error('Erro ao processar pagamento');
    }
  });

  // Mutation: Request withdrawal
  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      if (amount > wallet?.available_balance) {
        throw new Error('Saldo insuficiente');
      }
      return await base44.functions.invoke('createPayoutToWalker', {
        amount,
        email: user.email,
        name: user.full_name
      });
    },
    onSuccess: () => {
      toast.success('Pedido de saque criado! Processaremos em 24-48h.');
      setShowWithdraw(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries(['professionalWallet']);
      queryClient.invalidateQueries(['walletTransactions']);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao solicitar saque');
    }
  });

  if (loadingUser || loadingWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Saldo Disponível',
      value: `€${(wallet?.available_balance || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Pendente',
      value: `€${(wallet?.pending_balance || 0).toFixed(2)}`,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Total Ganho',
      value: `€${(wallet?.total_earnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Este Mês',
      value: `€${(wallet?.monthly_earnings || 0).toFixed(2)}`,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Minha Carteira</h1>
              <p className="text-sm text-gray-600">Gerencie seus ganhos e adicione créditos</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg}`}>
                      <Icon className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                    </div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">{stat.title}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Button
            onClick={() => setShowAddCredits(true)}
            className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg flex items-center gap-3 justify-center"
          >
            <Plus className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">Adicionar Créditos</div>
              <div className="text-xs opacity-80">Via Stripe</div>
            </div>
          </Button>

          <Button
            onClick={() => setShowWithdraw(true)}
            disabled={!wallet?.available_balance || wallet.available_balance <= 0}
            className="h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-lg flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm">Solicitar Saque</div>
              <div className="text-xs opacity-80">24-48h de processamento</div>
            </div>
          </Button>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  Histórico de Transações
                </CardTitle>
                {transactions.length > 0 && (
                  <Badge variant="outline">{transactions.length} transações</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Sem transações ainda</p>
                  <p className="text-sm text-gray-500">Suas transações aparecerão aqui</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const isIncome = ['service_completed', 'withdrawal_released', 'bonus'].includes(tx.transaction_type);
                    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                    const color = isIncome ? 'text-green-600' : 'text-red-600';
                    const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50';

                    return (
                      <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{tx.description}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(tx.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${color}`}>
                            {isIncome ? '+' : '-'}€{Math.abs(tx.amount || 0).toFixed(2)}
                          </p>
                          {tx.status === 'pending' && (
                            <Badge variant="outline" className="text-xs mt-1">Pendente</Badge>
                          )}
                          {tx.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-700 text-xs mt-1">Concluído</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-900 space-y-2">
                  <p className="font-semibold">Como funciona a Carteira?</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li><strong>Saldo Disponível:</strong> Pronto para sacar quando quiser</li>
                    <li><strong>Pendente:</strong> Ganhos em processamento (24-48h de serviço)</li>
                    <li><strong>Saques:</strong> Processados em 1-2 dias úteis para sua conta</li>
                    <li><strong>Créditos:</strong> Adicione via Stripe para usar na plataforma</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Credits Modal */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Adicionar Créditos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">Valor (€)</label>
              <Input
                type="number"
                placeholder="50"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                min="5"
                step="5"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map(v => (
                <Button
                  key={v}
                  variant={credits === v.toString() ? 'default' : 'outline'}
                  onClick={() => setCredits(v.toString())}
                  className="text-sm"
                >
                  €{v}
                </Button>
              ))}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Total a pagar:</strong> €{(parseFloat(credits) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sem taxas adicionais</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddCredits(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!credits || parseFloat(credits) < 5) {
                    toast.error('Mínimo €5');
                    return;
                  }
                  addCreditsMutation.mutate(parseFloat(credits));
                }}
                disabled={addCreditsMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {addCreditsMutation.isPending ? 'Processando...' : 'Pagar via Stripe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-semibold">Saldo Disponível</p>
              <p className="text-2xl font-black text-green-700">€{(wallet?.available_balance || 0).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">Valor a Sacar (€)</label>
              <Input
                type="number"
                placeholder={`Até €${(wallet?.available_balance || 0).toFixed(2)}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet?.available_balance || 0}
                step="0.01"
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Processado em 1-2 dias úteis
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Valor:</strong> €{(parseFloat(withdrawAmount) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Será enviado para a conta bancária associada
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(withdrawAmount);
                  if (!amount || amount <= 0) {
                    toast.error('Digite um valor válido');
                    return;
                  }
                  if (amount > wallet?.available_balance) {
                    toast.error('Saldo insuficiente');
                    return;
                  }
                  withdrawMutation.mutate(amount);
                }}
                disabled={withdrawMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {withdrawMutation.isPending ? 'Processando...' : 'Confirmar Saque'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}