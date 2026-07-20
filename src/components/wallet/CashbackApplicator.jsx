import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Wallet, Gift, Check, Info, Star } from "lucide-react";

/**
 * Componente para aplicar crédito de cashback em compras
 * O cashback é NÃO SACÁVEL - só pode ser usado na loja PawCão
 */
export default function CashbackApplicator({ 
  purchaseAmount,
  onApply,
  onSkip 
}) {
  const [creditToUse, setCreditToUse] = useState(0);

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

  const cashbackBalance = wallet?.cashback_balance || 0;
  const maxCredit = Math.min(cashbackBalance, purchaseAmount);
  const finalAmount = purchaseAmount - creditToUse;
  const cashbackRate = membership?.cashback_rate || 0;
  const futureEarnings = finalAmount * cashbackRate;

  if (cashbackBalance <= 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-700">Sem Crédito Disponível</p>
              <p className="text-xs text-gray-500">
                {cashbackRate > 0 
                  ? `Ganhe ${(cashbackRate * 100).toFixed(0)}% de cashback nesta compra!`
                  : 'Assine um plano para ganhar cashback'}
              </p>
            </div>
            {cashbackRate > 0 && (
              <Badge className="bg-green-100 text-green-700">
                +€{futureEarnings.toFixed(2)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-900">Crédito Disponível</p>
              <p className="text-xs text-green-700">
                Use seu cashback nesta compra
              </p>
            </div>
          </div>
          <Badge className="bg-green-600 text-white text-lg px-3 py-1">
            €{cashbackBalance.toFixed(2)}
          </Badge>
        </div>

        {/* Info */}
        <div className="bg-white/60 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2 text-xs text-green-700">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              O crédito de cashback só pode ser usado na Loja PawCão e serviços. 
              Não é convertível em dinheiro.
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Usar crédito:</span>
            <span className="font-bold text-green-700">€{creditToUse.toFixed(2)}</span>
          </div>
          <Slider
            value={[creditToUse]}
            onValueChange={(value) => setCreditToUse(value[0])}
            max={maxCredit}
            step={0.01}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>€0</span>
            <span>€{maxCredit.toFixed(2)}</span>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-gray-600">Valor da compra</span>
            <span>€{purchaseAmount.toFixed(2)}</span>
          </div>
          {creditToUse > 0 && (
            <div className="flex justify-between items-center mb-1 text-sm text-green-600">
              <span>Crédito aplicado</span>
              <span>-€{creditToUse.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between items-center">
            <span className="font-bold">A Pagar</span>
            <span className="font-bold text-lg">€{finalAmount.toFixed(2)}</span>
          </div>
          {cashbackRate > 0 && finalAmount > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <Star className="w-3 h-3" />
              <span>
                Vai ganhar +€{(finalAmount * cashbackRate).toFixed(2)} de cashback ({(cashbackRate * 100).toFixed(0)}%)
              </span>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCreditToUse(maxCredit);
            }}
            className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
            disabled={creditToUse >= maxCredit}
          >
            Usar Tudo
          </Button>
          <Button
            onClick={() => onApply(creditToUse)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {creditToUse > 0 ? 'Aplicar Crédito' : 'Continuar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}