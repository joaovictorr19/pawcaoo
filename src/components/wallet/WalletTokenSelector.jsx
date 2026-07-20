import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Clock, AlertTriangle, CheckCircle, Wallet, 
  ArrowRight, Calendar, Info 
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Componente para selecionar uso de Token no booking
 * Mostra saldo, restrições e permite usar token com surcharge se necessário
 */
export default function WalletTokenSelector({ 
  bookingId,
  walkerEmail,
  walkerName,
  scheduledDate,
  scheduledTime,
  onTokenUsed,
  onSkip 
}) {
  const queryClient = useQueryClient();
  const [showSurchargeConfirm, setShowSurchargeConfirm] = useState(false);
  const [surchargeInfo, setSurchargeInfo] = useState(null);

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

  const useTokenMutation = useMutation({
    mutationFn: async (acceptSurcharge) => {
      const response = await base44.functions.invoke('useTokenAndPayWalker', {
        booking_id: bookingId,
        walker_email: walkerEmail,
        walker_name: walkerName,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        accept_surcharge: acceptSurcharge
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.requires_surcharge) {
        setSurchargeInfo(data);
        setShowSurchargeConfirm(true);
      } else {
        queryClient.invalidateQueries(['myWallet']);
        toast.success(data.message);
        onTokenUsed?.(data);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao usar token');
    }
  });

  const handleUseToken = () => {
    useTokenMutation.mutate(false);
  };

  const handleAcceptSurcharge = () => {
    useTokenMutation.mutate(true);
    setShowSurchargeConfirm(false);
  };

  // Verificações
  const hasTokens = wallet?.service_tokens > 0;
  const tokensExpired = wallet?.tokens_expiry_date && new Date(wallet.tokens_expiry_date) < new Date();
  const tokenValue = membership?.token_value || 12;

  // Verificar se é período restrito
  const isRestricted = () => {
    if (!scheduledDate) return false;
    const date = new Date(scheduledDate);
    const dayOfWeek = date.getDay();
    const hour = scheduledTime ? parseInt(scheduledTime.split(':')[0]) : 12;
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isOffPeak = hour < 9 || hour >= 18;
    
    return { isWeekend, isOffPeak, hasSurcharge: isWeekend || isOffPeak };
  };

  const restriction = isRestricted();

  if (!wallet || !hasTokens) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
        <CardContent className="p-4 text-center">
          <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Sem tokens disponíveis</p>
          <p className="text-xs text-gray-500 mt-1">
            Assine um plano para receber passeios grátis mensais
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => window.location.href = '/MembershipPlans'}
          >
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tokensExpired) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">Tokens Expirados</p>
              <p className="text-xs text-red-600">Renove sua assinatura para receber novos tokens</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-900">Passeio Grátis Disponível!</p>
                <p className="text-xs text-green-700">
                  {wallet.service_tokens} token{wallet.service_tokens > 1 ? 's' : ''} restante{wallet.service_tokens > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 text-white">
              €{tokenValue} valor
            </Badge>
          </div>

          {/* Info de restrições */}
          {restriction.hasSurcharge && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-800">Taxa Adicional Aplicável</p>
                  <p className="text-yellow-700">
                    {restriction.isWeekend && 'Fim-de-semana: +€5'}
                    {restriction.isWeekend && restriction.isOffPeak && ' | '}
                    {restriction.isOffPeak && 'Horário fora do pico: +€3'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-green-700 mb-4">
            <Clock className="w-3 h-3" />
            <span>
              Válido até {format(new Date(wallet.tokens_expiry_date), "dd 'de' MMMM", { locale: pt })}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUseToken}
              disabled={useTokenMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {useTokenMutation.isPending ? (
                'Processando...'
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Usar Token Grátis
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onSkip}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Pagar Normal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Surcharge */}
      <AnimatePresence>
        {showSurchargeConfirm && surchargeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSurchargeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Taxa Adicional</h3>
                <p className="text-gray-600 mt-2">{surchargeInfo.message}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Valor do Token</span>
                  <span className="font-semibold">€{tokenValue}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-yellow-700">
                  <span>{surchargeInfo.surcharge_reason}</span>
                  <span className="font-semibold">+€{surchargeInfo.surcharge_amount}</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                  <span className="font-bold">Total a Pagar</span>
                  <span className="font-bold text-lg">€{surchargeInfo.surcharge_amount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSurchargeConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAcceptSurcharge}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Aceitar e Usar Token
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}