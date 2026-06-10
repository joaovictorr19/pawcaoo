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
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Disponível</p>
          <p className="text-lg font-bold text-slate-900">€{(wallet?.available_balance || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Pendente</p>
          <p className="text-lg font-bold text-slate-900">€{(wallet?.pending_balance || 0).toFixed(2)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
            <WalletIcon className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-slate-900">€{(wallet?.total_earnings || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => navigate(createPageUrl('MyWallet'))}
          className="h-11 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-semibold rounded-xl text-sm shadow-sm"
        >
          <WalletIcon className="w-4 h-4 mr-1.5" />
          Ver Carteira
        </Button>
        <Button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {/* Quick Add Credits Menu */}
      {showQuickAdd && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-slate-600 mb-2">Escolha um valor:</p>
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
                className="text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 rounded-xl"
              >
                €{amount}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQuickAdd(false)}
            className="w-full text-xs border-slate-200 text-slate-600 rounded-xl"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}