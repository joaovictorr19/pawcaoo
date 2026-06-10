import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ArrowUp, Calendar, CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function HotelFinancesPanel({ hotelProfile, bookings }) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [selectedIban, setSelectedIban] = useState('');

  // Calcula receita
  const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const platformFeeTotal = completedBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);
  const hotelEarnings = totalRevenue - platformFeeTotal;

  // Fetch withdrawal requests
  const { data: withdrawals = [] } = useQuery({
    queryKey: ['hotelWithdrawals', hotelProfile?.user_id],
    queryFn: async () => {
      if (!hotelProfile?.user_id) return [];
      try {
        return await base44.entities.IbanWithdrawalRequest.filter(
          { user_email: hotelProfile.created_by },
          '-created_date',
          10
        );
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        return [];
      }
    },
    enabled: !!hotelProfile?.user_id
  });

  // Create withdrawal request
  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      if (!selectedIban || !amount) {
        throw new Error('Preencha IBAN e montante');
      }

      return await base44.entities.IbanWithdrawalRequest.create({
        user_email: hotelProfile.created_by,
        iban: selectedIban,
        amount: parseFloat(amount),
        status: 'pending',
        notes: `Saque do hotel: ${hotelProfile.walker_name}`
      });
    },
    onSuccess: () => {
      toast.success('Solicitação de saque enviada!');
      setWithdrawAmount('');
      setSelectedIban('');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao solicitar saque');
    }
  });

  const handleRequestWithdraw = async () => {
    setIsSubmittingWithdraw(true);
    try {
      await withdrawMutation.mutateAsync(withdrawAmount);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const pendingWithdrawal = withdrawals.find(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Receita Total</p>
                <p className="text-3xl font-black text-green-700 mt-1">€{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
            <p className="text-xs text-green-600">{completedBookings.length} reservas concluídas</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Seus Ganhos</p>
                <p className="text-3xl font-black text-purple-700 mt-1">€{hotelEarnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
            <p className="text-xs text-purple-600">após taxa de plataforma</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Taxa Plataforma</p>
                <p className="text-3xl font-black text-orange-700 mt-1">€{platformFeeTotal.toFixed(2)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
            <p className="text-xs text-orange-600">{((platformFeeTotal / totalRevenue) * 100).toFixed(1)}% da receita</p>
          </Card>
        </motion.div>
      </div>

      {/* Withdrawal Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Solicitar Saque</h3>
          </div>

          {pendingWithdrawal && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Saque Pendente</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Tem um saque de €{pendingWithdrawal.amount?.toFixed(2)} aguardando aprovação
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                IBAN de Destino
              </label>
              <Input
                placeholder="PT50 0001 0000 0000 0000 0000 0"
                value={selectedIban}
                onChange={(e) => setSelectedIban(e.target.value.toUpperCase())}
                className="rounded-xl font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                Montante (€)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <Button
                  onClick={() => setWithdrawAmount(hotelEarnings.toString())}
                  variant="outline"
                  className="rounded-xl whitespace-nowrap"
                >
                  Máximo
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Disponível: €{hotelEarnings.toFixed(2)}</p>
            </div>

            <Button
              onClick={handleRequestWithdraw}
              disabled={!withdrawAmount || !selectedIban || isSubmittingWithdraw || withdrawAmount > hotelEarnings}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold h-11"
            >
              {isSubmittingWithdraw ? 'A processar...' : 'Solicitar Saque'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900 mb-4">Histórico de Saques</h3>
            <div className="space-y-3">
              {withdrawals.map((w, idx) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      €{w.amount?.toFixed(2)}
                      <Badge variant={w.status === 'paid' ? 'default' : w.status === 'approved' ? 'secondary' : 'outline'} className="text-xs">
                        {w.status === 'paid' && <>✓ Pago</>}
                        {w.status === 'approved' && <>⏳ Aprovado</>}
                        {w.status === 'pending' && <>⏰ Pendente</>}
                        {w.status === 'rejected' && <>✗ Rejeitado</>}
                      </Badge>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{w.iban}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(w.created_date).toLocaleDateString('pt-PT')}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}