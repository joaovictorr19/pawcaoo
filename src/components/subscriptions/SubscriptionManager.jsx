import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, CheckCircle2, XCircle, Calendar, 
  Crown, AlertCircle, ExternalLink, Pause, Play 
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SubscriptionManager({ subscriptionType = 'owner' }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', subscriptionType, user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const subs = subscriptionType === 'owner'
        ? await base44.entities.OwnerSubscription.filter({ owner_email: user.email, is_active: true })
        : await base44.entities.WalkerSubscription.filter({ walker_email: user.email, is_active: true });
      
      return subs[0] || null;
    },
    enabled: !!user?.email,
  });

  const manageSubscriptionMutation = useMutation({
    mutationFn: async (action) => {
      setLoading(true);
      const response = await base44.functions.invoke('manageSubscription', {
        action,
        subscription_type: subscriptionType
      });
      return response.data;
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries(['subscription']);
      
      if (action === 'get_portal' && data.portal_url) {
        window.open(data.portal_url, '_blank');
        toast.success("Portal de faturação aberto");
      } else if (action === 'cancel') {
        toast.success("Subscrição será cancelada no fim do período");
      } else if (action === 'reactivate') {
        toast.success("Subscrição reativada com sucesso");
      } else if (action === 'pause') {
        toast.success("Subscrição pausada");
      } else if (action === 'resume') {
        toast.success("Subscrição retomada");
      }
      
      setLoading(false);
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
      setLoading(false);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">A carregar subscrição...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-8 text-center">
          <Crown className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sem Subscrição Ativa</h3>
          <p className="text-gray-600 mb-6">
            Subscreva agora para ter acesso a benefícios exclusivos!
          </p>
          <Button 
            onClick={() => window.location.href = '/OwnerSubscriptions'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ver Planos Disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getPlanBadge = () => {
    const colors = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      premium: "bg-purple-500",
      pro: "bg-indigo-600",
      vip: "bg-yellow-500"
    };
    return colors[subscription.plan_type] || "bg-gray-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Minha Subscrição
            </CardTitle>
            <Badge className={`${getPlanBadge()} text-white text-lg px-4 py-1`}>
              {subscription.plan_type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Subscription Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Plano</p>
              <p className="text-lg font-bold text-gray-900">{subscription.plan_type.toUpperCase()}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Ciclo de Faturação</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Valor</p>
              <p className="text-lg font-bold text-green-600">
                €{subscription.billing_cycle === 'monthly' 
                  ? subscription.monthly_price?.toFixed(2) || subscription.monthly_fee?.toFixed(2)
                  : subscription.annual_price?.toFixed(2) || subscription.annual_fee?.toFixed(2)
                }
                /{subscription.billing_cycle === 'monthly' ? 'mês' : 'ano'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Próxima Cobrança</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.next_billing_date 
                    ? new Date(subscription.next_billing_date).toLocaleDateString('pt-PT')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          {subscription.is_active ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Subscrição Ativa</strong>
                {!subscription.auto_renew && " - Será cancelada no fim do período atual"}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>Subscrição Inativa</strong> - Renove para continuar a usufruir dos benefícios
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              onClick={() => manageSubscriptionMutation.mutate('get_portal')}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Gerir Pagamentos
            </Button>

            {subscription.auto_renew ? (
              <Button
                onClick={() => manageSubscriptionMutation.mutate('cancel')}
                disabled={loading}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Renovação
              </Button>
            ) : (
              <Button
                onClick={() => manageSubscriptionMutation.mutate('reactivate')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Reativar
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>💡 <strong>Dica:</strong> Pode gerir métodos de pagamento, ver faturas e atualizar o plano através do Portal de Faturação.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}