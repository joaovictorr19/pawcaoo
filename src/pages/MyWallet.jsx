import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, Zap, Star, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, 
  Gift, ShoppingBag, Dog, Calendar, Crown, Sparkles 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";

export default function MyWallet() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      const wallets = await base44.entities.UserWallet.filter({ 
        user_email: user.email 
      });
      return wallets[0] || {
        cashback_balance: 0,
        service_tokens: 0,
        total_points: 0,
        escrow_balance: 0
      };
    },
    enabled: !!user?.email
  });

  const { data: membership } = useQuery({
    queryKey: ['myMembership', user?.email],
    queryFn: async () => {
      const plans = await base44.entities.MembershipPlan.filter({ 
        user_email: user.email,
        status: 'active'
      });
      return plans[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions', user?.email],
    queryFn: () => base44.entities.WalletTransaction.filter({ 
      user_email: user.email 
    }, '-created_date', 50),
    enabled: !!user?.email
  });

  const planColors = {
    FREE: 'from-gray-400 to-gray-500',
    BASIC: 'from-blue-500 to-blue-600',
    PREMIUM: 'from-purple-500 to-indigo-600',
    VIP: 'from-yellow-500 to-orange-500'
  };

  const getTransactionIcon = (type) => {
    const icons = {
      cashback_earned: <Gift className="w-4 h-4 text-green-500" />,
      cashback_used: <ShoppingBag className="w-4 h-4 text-red-500" />,
      token_credited: <Zap className="w-4 h-4 text-blue-500" />,
      token_used: <Dog className="w-4 h-4 text-purple-500" />,
      token_expired: <Clock className="w-4 h-4 text-gray-500" />,
      points_earned: <Star className="w-4 h-4 text-yellow-500" />,
      points_redeemed: <Gift className="w-4 h-4 text-pink-500" />,
      escrow_reserved: <TrendingUp className="w-4 h-4 text-blue-500" />,
      escrow_released: <ArrowUpRight className="w-4 h-4 text-green-500" />,
      escrow_expired: <ArrowDownLeft className="w-4 h-4 text-red-500" />
    };
    return icons[type] || <Wallet className="w-4 h-4" />;
  };

  const isPositive = (type) => {
    return ['cashback_earned', 'token_credited', 'points_earned', 'escrow_reserved'].includes(type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-gray-900 mb-2">Minha Wallet</h1>
          <p className="text-gray-600">Gerencie seus tokens, cashback e pontos</p>
        </motion.div>

        {/* Membership Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`mb-6 border-0 shadow-xl overflow-hidden bg-gradient-to-r ${planColors[membership?.plan_type || 'FREE']} text-white`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6" />
                    <span className="font-bold text-lg">Plano {membership?.plan_type || 'FREE'}</span>
                  </div>
                  <p className="text-white/80 text-sm">
                    {membership?.plan_type === 'FREE' 
                      ? 'Faça upgrade para ganhar mais benefícios!'
                      : `Próxima renovação: ${membership?.current_period_end || 'N/A'}`
                    }
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate(createPageUrl('MembershipPlans'))}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  {membership?.plan_type === 'FREE' ? 'Fazer Upgrade' : 'Gerenciar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  {wallet?.tokens_expiry_date && (
                    <Badge variant="outline" className="text-xs">
                      Expira {format(new Date(wallet.tokens_expiry_date), 'dd/MM', { locale: pt })}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">Tokens de Serviço</p>
                <p className="text-3xl font-black text-gray-900">{wallet?.service_tokens || 0}</p>
                <p className="text-xs text-gray-500 mt-1">= €{(wallet?.service_tokens || 0) * 12} em passeios</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cashback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    {(membership?.cashback_rate * 100 || 0)}% cashback
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Saldo Cashback</p>
                <p className="text-3xl font-black text-gray-900">€{(wallet?.cashback_balance || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Uso interno na plataforma</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                    {membership?.points_multiplier || 1}x multiplicador
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total de Pontos</p>
                <p className="text-3xl font-black text-gray-900">{(wallet?.total_points || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Troque por recompensas</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(createPageUrl('Home'))}
          >
            <Dog className="w-5 h-5 text-blue-600" />
            <span className="text-xs">Usar Token</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(createPageUrl('Partners'))}
          >
            <ShoppingBag className="w-5 h-5 text-green-600" />
            <span className="text-xs">Loja</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
          >
            <Gift className="w-5 h-5 text-purple-600" />
            <span className="text-xs">Resgatar Pontos</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(createPageUrl('MembershipPlans'))}
          >
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <span className="text-xs">Upgrade</span>
          </Button>
        </motion.div>

        {/* Transactions History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Histórico de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma transação ainda</p>
                  <p className="text-sm text-gray-400">Suas transações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {getTransactionIcon(tx.transaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(tx.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                      <div className="text-right">
                        {tx.amount > 0 && (
                          <p className={`font-bold ${isPositive(tx.transaction_type) ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive(tx.transaction_type) ? '+' : '-'}€{tx.amount.toFixed(2)}
                          </p>
                        )}
                        {tx.tokens_amount > 0 && (
                          <p className={`text-sm font-semibold ${isPositive(tx.transaction_type) ? 'text-blue-600' : 'text-gray-600'}`}>
                            {isPositive(tx.transaction_type) ? '+' : '-'}{tx.tokens_amount} token(s)
                          </p>
                        )}
                        {tx.points_amount > 0 && (
                          <p className="text-sm font-semibold text-yellow-600">
                            +{tx.points_amount} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}