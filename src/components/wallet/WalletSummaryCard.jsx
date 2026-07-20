import React from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, Zap, Star, Gift, Crown, ArrowRight, 
  Clock, TrendingUp 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

/**
 * Card resumo da Wallet para exibir no Dashboard/Home
 */
export default function WalletSummaryCard({ compact = false }) {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      const wallets = await base44.entities.UserWallet.filter({ 
        user_email: user.email 
      });
      return wallets[0] || null;
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

  if (!user) return null;

  const planColors = {
    FREE: 'from-gray-400 to-gray-500',
    BASIC: 'from-blue-500 to-blue-600',
    PREMIUM: 'from-purple-500 to-indigo-600',
    VIP: 'from-yellow-500 to-orange-500'
  };

  const tokens = wallet?.service_tokens || 0;
  const cashback = wallet?.cashback_balance || 0;
  const points = wallet?.total_points || 0;
  const planType = membership?.plan_type || 'FREE';
  const tokenValue = membership?.token_value || 12;

  // Dias até expiração
  const daysUntilExpiry = wallet?.tokens_expiry_date 
    ? differenceInDays(new Date(wallet.tokens_expiry_date), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(createPageUrl('MyWallet'))}
      >
        <div className={`w-10 h-10 bg-gradient-to-r ${planColors[planType]} rounded-xl flex items-center justify-center`}>
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            Plano {planType}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {tokens > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                {tokens}
              </span>
            )}
            {cashback > 0 && (
              <span className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-green-500" />
                €{cashback.toFixed(0)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {points}
            </span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </motion.div>
    );
  }

  return (
    <Card className={`border-0 shadow-xl overflow-hidden bg-gradient-to-r ${planColors[planType]}`}>
      <CardContent className="p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">Minha Wallet</p>
              <p className="text-white/80 text-sm">Plano {planType}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(createPageUrl('MyWallet'))}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            Ver Detalhes
          </Button>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tokens */}
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Passeios</span>
            </div>
            <p className="text-3xl font-black">{tokens}</p>
            {tokens > 0 && (
              <p className="text-xs text-white/70 mt-1">
                = €{tokens * tokenValue} valor
              </p>
            )}
            {isExpiringSoon && (
              <Badge className="mt-2 bg-yellow-500/80 text-white text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Expira em {daysUntilExpiry}d
              </Badge>
            )}
            {isExpired && tokens > 0 && (
              <Badge className="mt-2 bg-red-500/80 text-white text-xs">
                Expirado!
              </Badge>
            )}
          </div>

          {/* Cashback */}
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5" />
              <span className="text-sm font-medium">Crédito</span>
            </div>
            <p className="text-3xl font-black">€{cashback.toFixed(0)}</p>
            <p className="text-xs text-white/70 mt-1">
              {membership?.cashback_rate 
                ? `${(membership.cashback_rate * 100).toFixed(0)}% cashback`
                : 'Uso interno'}
            </p>
          </div>

          {/* Points */}
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5" />
              <span className="text-sm font-medium">Pontos</span>
            </div>
            <p className="text-3xl font-black">{points.toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-1">
              {membership?.points_multiplier 
                ? `${membership.points_multiplier}x multiplicador`
                : '1 pt/€'}
            </p>
          </div>
        </div>

        {/* CTA */}
        {planType === 'FREE' && (
          <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Quer mais benefícios?</p>
                <p className="text-sm text-white/80">Passeios grátis, cashback e mais!</p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('MembershipPlans'))}
                className="bg-white text-gray-900 hover:bg-white/90"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}