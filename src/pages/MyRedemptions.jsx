import React from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Copy, CheckCircle, Clock, XCircle, Package, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function MyRedemptions() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: redemptions = [], isLoading } = useQuery({
    queryKey: ['myRedemptions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const all = await base44.entities.Redemption.filter({
        user_email: user.email
      }, '-created_date');
      return all;
    },
    enabled: !!user?.email,
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado para área de transferência!');
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-yellow-500', label: 'Pendente' },
      confirmed: { icon: CheckCircle, color: 'bg-green-500', label: 'Confirmado' },
      shipped: { icon: Package, color: 'bg-blue-500', label: 'Enviado' },
      delivered: { icon: CheckCircle, color: 'bg-green-600', label: 'Entregue' },
      cancelled: { icon: XCircle, color: 'bg-red-500', label: 'Cancelado' }
    };
    return configs[status] || configs.pending;
  };

  const activeRedemptions = redemptions.filter(r => r.status === 'confirmed');
  const usedRedemptions = redemptions.filter(r => r.status !== 'confirmed');

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Gift className="w-10 h-10 text-purple-600" />
            Meus Resgates PawPoints
          </h1>
          <p className="text-lg text-gray-600">Gerir os seus vouchers e descontos</p>
        </div>

        {/* Active Vouchers */}
        {activeRedemptions.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-green-600" />
              Vouchers Ativos ({activeRedemptions.length})
            </h2>
            <div className="grid gap-4 mb-8">
              {activeRedemptions.map((redemption) => {
                const statusConfig = getStatusConfig(redemption.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={redemption.id} className="glass-panel border-2 border-green-400 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {redemption.product_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {redemption.euro_value > 0 
                              ? `Valor: €${redemption.euro_value}` 
                              : 'Benefício especial'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Resgatado: {format(new Date(redemption.created_date), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge className={`${statusConfig.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4 border-2 border-purple-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Código de Resgate:</p>
                            <p className="font-mono font-bold text-2xl text-purple-700">
                              {redemption.redemption_code}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyCode(redemption.redemption_code)}
                            className="ml-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Como usar:</strong> Insira este código no checkout para aplicar o desconto automaticamente
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Used/Past Redemptions */}
        {usedRedemptions.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-gray-600" />
              Histórico de Resgates ({usedRedemptions.length})
            </h2>
            <div className="grid gap-3">
              {usedRedemptions.map((redemption) => {
                const statusConfig = getStatusConfig(redemption.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={redemption.id} className="glass-panel border-2 border-white/40 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{redemption.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            {redemption.points_spent} pontos • €{redemption.euro_value}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(redemption.created_date), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge className={`${statusConfig.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {redemptions.length === 0 && (
          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum resgate ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Acumule PawPoints e resgate recompensas incríveis!
              </p>
              <Button
                onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
              >
                Ver Recompensas Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}