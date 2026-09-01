import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from '@/utils/getCurrentUser';
import { Switch } from '@/components/ui/switch';
import { Wallet } from 'lucide-react';

/**
 * WalletPaymentOption
 * Mostra um toggle para o cliente usar o saldo da carteira (cashback_balance)
 * para pagar (total ou parcialmente) um serviço. O saldo é não-sacável e
 * vem de carregamentos (top-ups) e cashback ganho.
 *
 * @param {boolean} useWallet - estado controlado
 * @param {function} onToggle - setter
 * @param {number} amountToPay - valor total a pagar pelo serviço
 */
export default function WalletPaymentOption({ useWallet, onToggle, amountToPay }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: 60 * 1000,
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      return wallets[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
  });

  const balance = Math.round((wallet?.cashback_balance || 0) * 100) / 100;
  if (balance <= 0 || amountToPay <= 0) return null;

  const applied = useWallet ? Math.min(balance, amountToPay) : 0;
  const remaining = Math.max(0, Math.round((amountToPay - applied) * 100) / 100);

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-900">Usar saldo da carteira</p>
            <p className="text-[10px] text-teal-600">€{balance.toFixed(2)} disponível</p>
          </div>
        </div>
        <Switch checked={useWallet} onCheckedChange={onToggle} aria-label="Usar saldo da carteira" />
      </div>
      {useWallet && applied > 0 && (
        <div className="text-[11px] text-teal-700 space-y-0.5 pt-1.5 border-t border-teal-100">
          <div className="flex justify-between">
            <span>Valor do serviço</span>
            <span>€{amountToPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-teal-600">
            <span>Pago com carteira</span>
            <span>-€{applied.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-0.5">
            <span>Falta pagar (cartão)</span>
            <span>€{remaining.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}