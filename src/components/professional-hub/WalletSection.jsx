import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, Plus, ArrowUpRight, TrendingUp, Wallet as WalletIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export function WalletSection({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: wallet } = useQuery({
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
      };
    },
    enabled: !!user?.email,
  });

  const addQuickCreditsMutation = useMutation({
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
      }
    }
  });

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-200 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-700" />
              </div>
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">Disponível</p>
            <p className="text-xl font-black text-gray-900">€{(wallet?.available_balance || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-700" />
              </div>
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">Pendente</p>
            <p className="text-xl font-black text-gray-900">€{(wallet?.pending_balance || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-blue-700" />
              </div>
            </div>
            <p className="text-[11px] text-gray-600 font-semibold">Total</p>
            <p className="text-xl font-black text-gray-900">€{(wallet?.total_earnings || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => navigate(createPageUrl('MyWalletPro'))}
          className="h-12 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <WalletIcon className="w-4 h-4" />
          Ver Carteira
        </Button>
        <Button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {/* Quick Add Credits Menu */}
      {showQuickAdd && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Escolha um valor:</p>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map(amount => (
                <Button
                  key={amount}
                  size="sm"
                  onClick={() => {
                    addQuickCreditsMutation.mutate(amount);
                    setShowQuickAdd(false);
                  }}
                  disabled={addQuickCreditsMutation.isPending}
                  className="text-sm font-bold bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                >
                  €{amount}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQuickAdd(false)}
              className="w-full text-xs"
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}