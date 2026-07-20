import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Wallet, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function MembershipSuccess() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });

  const { data: membership, isLoading } = useQuery({
    queryKey: ['myMembership', user?.email],
    queryFn: async () => {
      const plans = await base44.entities.MembershipPlan.filter({ 
        user_email: user.email,
        status: 'active'
      });
      return plans[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 2000 // Poll while waiting for webhook
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      const wallets = await base44.entities.UserWallet.filter({ 
        user_email: user.email 
      });
      return wallets[0] || null;
    },
    enabled: !!user?.email,
    refetchInterval: 2000
  });

  useEffect(() => {
    if (membership) {
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [membership]);

  const planColors = {
    BASIC: 'from-blue-500 to-blue-600',
    PREMIUM: 'from-purple-500 to-indigo-600',
    VIP: 'from-yellow-500 to-orange-500'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processando sua assinatura...</h2>
            <p className="text-gray-600">Aguarde um momento enquanto confirmamos o pagamento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className={`bg-gradient-to-r ${planColors[membership?.plan_type] || 'from-green-500 to-emerald-500'} p-8 text-center text-white`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-12 h-12" />
              </motion.div>
              <h1 className="text-3xl font-black mb-2">Parabéns!</h1>
              <p className="text-xl opacity-90">
                Você agora é membro {membership?.plan_type || 'Premium'}
              </p>
            </div>

            <CardContent className="p-8">
              {/* Benefits Summary */}
              <div className="space-y-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Seus Benefícios Ativos
                </h2>

                <div className="grid gap-4">
                  {/* Tokens */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Tokens de Serviço</p>
                      <p className="text-sm text-gray-600">
                        {wallet?.service_tokens || membership?.monthly_tokens || 0} passeios grátis disponíveis
                      </p>
                    </div>
                    <span className="text-2xl font-black text-blue-600">
                      {wallet?.service_tokens || membership?.monthly_tokens || 0}
                    </span>
                  </div>

                  {/* Cashback */}
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Cashback na Loja</p>
                      <p className="text-sm text-gray-600">
                        {(membership?.cashback_rate * 100 || 0)}% de volta em todas as compras
                      </p>
                    </div>
                    <span className="text-2xl font-black text-green-600">
                      {(membership?.cashback_rate * 100 || 0)}%
                    </span>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Multiplicador de Pontos</p>
                      <p className="text-sm text-gray-600">
                        {membership?.points_multiplier || 1}x pontos em cada compra
                      </p>
                    </div>
                    <span className="text-2xl font-black text-purple-600">
                      {membership?.points_multiplier || 1}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold"
                >
                  Agendar um Passeio
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('MyWallet'))}
                  className="w-full h-12"
                >
                  Ver Minha Wallet
                </Button>
              </div>

              {/* Validity Notice */}
              <p className="text-center text-sm text-gray-500 mt-6">
                Seus tokens são válidos até o próximo ciclo de cobrança.
                <br />
                Próxima renovação: {membership?.current_period_end || 'Em 30 dias'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}