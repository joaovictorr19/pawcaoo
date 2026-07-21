import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, ArrowUp, Clock, AlertCircle, Euro,
  CheckCircle2, XCircle, RefreshCw, Wallet, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, isSameMonth, parseISO, subMonths } from 'date-fns';
import { pt, es, fr } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageContext';
import HotelFiscalReceipt from './HotelFiscalReceipt';

const LOCALES = { pt, es, fr };

const I18N = {
  pt: {
    monthEarnings: 'Ganhos do Mês', grossRev: 'receita bruta', toReceive: 'Valores a Receber',
    pendingPays: 'pagamentos pendentes', totalEarnings: 'Ganhos Totais', afterFees: f => `após ${f} em taxas`,
    monthlyChart: 'Ganhos Mensais (6 meses)', perBooking: 'Pagamentos por Reserva',
    all: 'Todas', pending: 'Pendentes', paid: 'Pagas', partial: 'Parciais',
    noBooking: 'Nenhuma reserva encontrada', client: 'Cliente', gross: 'Bruto', fee: 'Taxa', net: 'Líquido',
    payment: 'Pagamento', requestWithdraw: 'Solicitar Saque', pendingWithdraw: 'Saque Pendente',
    withdrawPending: a => `Tem um saque de ${a} aguardando aprovação`, ibanDest: 'IBAN de Destino',
    amount: 'Montante (€)', max: 'Máximo', available: a => `Disponível: ${a}`, processing: 'A processar...',
    withdrawHistory: 'Histórico de Saques', res: 'res.',
    status: { pending: 'Pendente', paid: 'Pago', partial: 'Parcial', refunded: 'Reembolsado', approved: 'Aprovado', rejected: 'Rejeitado' },
    withdrawToast: 'Saque solicitado!', withdrawErr: e => e || 'Erro ao solicitar saque',
    withdrawNote: n => `Saque do hotel: ${n}`, ibanErr: 'Preencha IBAN e montante',
    services: { boarding: 'Alojamento', daycare: 'Creche', grooming: 'Grooming', walk_with_partner: 'Passeio', training: 'Treino' },
  },
  es: {
    monthEarnings: 'Ganancias del Mes', grossRev: 'ingresos brutos', toReceive: 'Pendientes de Cobro',
    pendingPays: 'pagos pendientes', totalEarnings: 'Ganancias Totales', afterFees: f => `tras ${f} en comisiones`,
    monthlyChart: 'Ganancias Mensuales (6 meses)', perBooking: 'Pagos por Reserva',
    all: 'Todas', pending: 'Pendientes', paid: 'Pagadas', partial: 'Parciales',
    noBooking: 'Ninguna reserva encontrada', client: 'Cliente', gross: 'Bruto', fee: 'Comisión', net: 'Líquido',
    payment: 'Pago', requestWithdraw: 'Solicitar Retiro', pendingWithdraw: 'Retiro Pendiente',
    withdrawPending: a => `Tienes un retiro de ${a} esperando aprobación`, ibanDest: 'IBAN de Destino',
    amount: 'Cantidad (€)', max: 'Máximo', available: a => `Disponible: ${a}`, processing: 'Procesando...',
    withdrawHistory: 'Historial de Retiros', res: 'res.',
    status: { pending: 'Pendiente', paid: 'Pagado', partial: 'Parcial', refunded: 'Reembolsado', approved: 'Aprobado', rejected: 'Rechazado' },
    withdrawToast: '¡Retiro solicitado!', withdrawErr: e => e || 'Error al solicitar retiro',
    withdrawNote: n => `Retiro del hotel: ${n}`, ibanErr: 'Completa IBAN y cantidad',
    services: { boarding: 'Alojamiento', daycare: 'Guardería', grooming: 'Grooming', walk_with_partner: 'Paseo', training: 'Adiestramiento' },
  },
  fr: {
    monthEarnings: 'Gains du Mois', grossRev: 'revenu brut', toReceive: 'À Recevoir',
    pendingPays: 'paiements en attente', totalEarnings: 'Gains Totaux', afterFees: f => `après ${f} de commissions`,
    monthlyChart: 'Gains Mensuels (6 mois)', perBooking: 'Paiements par Réservation',
    all: 'Toutes', pending: 'En attente', paid: 'Payées', partial: 'Partielles',
    noBooking: 'Aucune réservation trouvée', client: 'Client', gross: 'Brut', fee: 'Commission', net: 'Net',
    payment: 'Paiement', requestWithdraw: 'Demander Retrait', pendingWithdraw: 'Retrait en Attente',
    withdrawPending: a => `Vous avez un retrait de ${a} en attente d'approbation`, ibanDest: 'IBAN de Destination',
    amount: 'Montant (€)', max: 'Maximum', available: a => `Disponible: ${a}`, processing: 'Traitement...',
    withdrawHistory: 'Historique des Retraits', res: 'rés.',
    status: { pending: 'En attente', paid: 'Payé', partial: 'Partiel', refunded: 'Remboursé', approved: 'Approuvé', rejected: 'Rejeté' },
    withdrawToast: 'Retrait demandé!', withdrawErr: e => e || 'Erreur lors de la demande de retrait',
    withdrawNote: n => `Retrait hôtel: ${n}`, ibanErr: 'Remplir IBAN et montant',
    services: { boarding: 'Pension', daycare: 'Garde', grooming: 'Toilettage', walk_with_partner: 'Promenade', training: 'Dressage' },
  },
};

const PAYMENT_STATUS_CONFIG = (tr) => ({
  pending:  { label: tr.status.pending,  dot: 'bg-amber-500',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:     { label: tr.status.paid,     dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial:  { label: tr.status.partial,  dot: 'bg-blue-500',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  refunded: { label: tr.status.refunded, dot: 'bg-red-500',     cls: 'bg-red-50 text-red-600 border-red-200' },
});

export default function HotelFinancesPanel({ hotelProfile, bookings }) {
  const { language } = useLanguage();
  const lang = ['pt', 'es', 'fr'].includes(language) ? language : 'pt';
  const tr = I18N[lang];
  const dateLocale = LOCALES[lang];

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [selectedIban, setSelectedIban] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const now = new Date();
  const validBookings = (bookings || []).filter(b => !['cancelled', 'rejected'].includes(b.status));

  const { currentMonthEarnings, pendingReceivable, totalEarnings, currentMonthCount } = useMemo(() => {
    const completed = validBookings.filter(b => b.status === 'completed');
    const currentMonthCompleted = completed.filter(b => {
      try { return isSameMonth(parseISO(b.checkin_date), now); } catch { return false; }
    });
    const currentMonthRevenue = currentMonthCompleted.reduce((s, b) => s + (b.total_amount || 0), 0);
    const currentMonthEarnings = currentMonthCompleted.reduce((s, b) => s + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const pendingReceivable = validBookings
      .filter(b => ['pending', 'partial'].includes(b.payment_status) && ['confirmed', 'checked_in', 'in_progress', 'checked_out', 'completed'].includes(b.status))
      .reduce((s, b) => s + ((b.total_amount || 0) - (b.payment_status === 'partial' ? (b.service_amount || 0) : 0)), 0);
    const totalRevenue = completed.reduce((s, b) => s + (b.total_amount || 0), 0);
    const platformFeeTotal = completed.reduce((s, b) => s + (b.platform_fee || 0), 0);
    const totalEarnings = totalRevenue - platformFeeTotal;
    const currentMonthCount = currentMonthCompleted.length;
    return { currentMonthEarnings, pendingReceivable, totalEarnings, platformFeeTotal, currentMonthCount };
  }, [bookings]);

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthBookings = validBookings.filter(b => {
        try { return isSameMonth(parseISO(b.checkin_date), monthDate); } catch { return false; }
      });
      const revenue = monthBookings.reduce((s, b) => s + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
      months.push({ label: format(monthDate, 'MMM', { locale: dateLocale }), revenue, count: monthBookings.length });
    }
    return months;
  }, [bookings, dateLocale]);

  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  const paymentBookings = useMemo(() => {
    let list = [...validBookings].sort((a, b) => {
      try { return parseISO(b.checkin_date) - parseISO(a.checkin_date); } catch { return 0; }
    });
    if (paymentFilter !== 'all') list = list.filter(b => b.payment_status === paymentFilter);
    return list;
  }, [bookings, paymentFilter]);

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['hotelWithdrawals', hotelProfile?.user_id],
    queryFn: async () => {
      if (!hotelProfile?.user_id) return [];
      try {
        return await base44.entities.IbanWithdrawalRequest.filter({ user_email: hotelProfile.created_by }, '-created_date', 10);
      } catch { return []; }
    },
    enabled: !!hotelProfile?.user_id
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      if (!selectedIban || !amount) throw new Error(tr.ibanErr);
      const response = await base44.functions.invoke('requestWalletWithdrawal', {
        amount: parseFloat(amount), iban: selectedIban
      });
      return response.data;
    },
    onSuccess: () => { toast.success(tr.withdrawToast); setWithdrawAmount(''); setSelectedIban(''); },
    onError: (error) => toast.error(tr.withdrawErr(error?.response?.data?.error || error.message))
  });

  const handleRequestWithdraw = async () => {
    setIsSubmittingWithdraw(true);
    try { await withdrawMutation.mutateAsync(withdrawAmount); } finally { setIsSubmittingWithdraw(false); }
  };

  const pendingWithdrawal = withdrawals.find(w => w.status === 'pending');
  const statusCfg = PAYMENT_STATUS_CONFIG(tr);

  const kpiCards = [
    { label: tr.monthEarnings, value: `${currentMonthEarnings.toFixed(2)}€`, sub: `${currentMonthCount} ${tr.res}`,
      icon: TrendingUp, iconCls: 'text-emerald-500', valueCls: 'text-emerald-700', bgCls: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' },
    { label: tr.toReceive, value: `${pendingReceivable.toFixed(2)}€`, sub: tr.pendingPays,
      icon: Clock, iconCls: 'text-amber-500', valueCls: 'text-amber-700', bgCls: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' },
    { label: tr.totalEarnings, value: `${totalEarnings.toFixed(2)}€`, sub: lang === 'pt' ? 'líquido recebido' : lang === 'es' ? 'neto recibido' : 'net reçu',
      icon: Wallet, iconCls: 'text-blue-500', valueCls: 'text-blue-700', bgCls: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' },
  ];

  const filterPills = [
    { key: 'all', label: tr.all }, { key: 'pending', label: tr.pending },
    { key: 'paid', label: tr.paid }, { key: 'partial', label: tr.partial },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className={`${kpi.bgCls} border p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                    <p className={`text-2xl font-black mt-1 ${kpi.valueCls}`}>{kpi.value}</p>
                  </div>
                  <Icon className={`w-7 h-7 ${kpi.iconCls} opacity-50 shrink-0`} />
                </div>
                <p className="text-[10px] text-slate-500">{kpi.sub}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">{tr.monthlyChart}</p>
        </div>
        <div className="flex items-end justify-between gap-2 h-36">
          {monthlyData.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-bold text-slate-600 h-4">{m.revenue > 0 ? `${m.revenue.toFixed(0)}€` : ''}</div>
              <div className="w-full bg-slate-100 rounded-t-md flex items-end overflow-hidden" style={{ height: '100px' }}>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`w-full rounded-t-md ${i === monthlyData.length - 1 ? 'bg-slate-900' : 'bg-slate-400'}`}
                  style={{ minHeight: m.revenue > 0 ? '4px' : '0' }} />
              </div>
              <span className="text-[10px] font-medium text-slate-400 capitalize">{m.label}</span>
              <span className="text-[9px] text-slate-300">{m.count} {tr.res}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">{tr.perBooking}</p>
          </div>
          <div className="flex items-center gap-1">
            {filterPills.map(f => (
              <button key={f.key} onClick={() => setPaymentFilter(f.key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  paymentFilter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {paymentBookings.length === 0 ? (
          <div className="py-8 text-center">
            <Euro className="!min-h-[2rem] w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-xs text-slate-400">{tr.noBooking}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="hidden md:grid grid-cols-[1fr_100px_90px] gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              <span>{tr.client}</span>
              <span className="text-right">{tr.net}</span>
              <span className="text-center">{tr.payment}</span>
            </div>
            {paymentBookings.map(b => {
              const payCfg = statusCfg[b.payment_status] || statusCfg.pending;
              const net = (b.total_amount || 0) - (b.platform_fee || 0);
              return (
                <div key={b.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_90px] gap-2 items-center px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{b.owner_name}</p>
                    <p className="text-[10px] text-slate-400">{tr.services[b.service_type] || b.service_type} · {b.checkin_date}</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 text-right hidden md:block">{net.toFixed(2)}€</p>
                  <div className="flex justify-end md:justify-center">
                    <Badge variant="outline" className={`text-[9px] border ${payCfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${payCfg.dot} mr-1`} />{payCfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <HotelFiscalReceipt hotelProfile={hotelProfile} bookings={bookings} />

      <Card className="border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <ArrowUp className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">{tr.requestWithdraw}</h3>
        </div>

        {pendingWithdrawal && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">{tr.pendingWithdraw}</p>
              <p className="text-[10px] text-amber-700 mt-0.5">{tr.withdrawPending(`${pendingWithdrawal.amount?.toFixed(2)}€`)}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">{tr.ibanDest}</label>
            <Input placeholder="PT50 0001 0000 0000 0000 0000 0" value={selectedIban}
              onChange={(e) => setSelectedIban(e.target.value.toUpperCase())} className="rounded-lg font-mono text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">{tr.amount}</label>
            <div className="flex gap-2">
              <Input type="number" step="0.01" placeholder="100.00" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} className="rounded-lg flex-1" />
              <Button onClick={() => setWithdrawAmount(totalEarnings.toString())} variant="outline"
                className="rounded-lg whitespace-nowrap text-xs">{tr.max}</Button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{tr.available(`${totalEarnings.toFixed(2)}€`)}</p>
          </div>
          <Button onClick={handleRequestWithdraw}
            disabled={!withdrawAmount || !selectedIban || isSubmittingWithdraw || parseFloat(withdrawAmount) > totalEarnings}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold h-10">
            {isSubmittingWithdraw ? tr.processing : tr.requestWithdraw}
          </Button>
        </div>
      </Card>

      {withdrawals.length > 0 && (
        <Card className="border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">{tr.withdrawHistory}</h3>
          <div className="space-y-2">
            {withdrawals.map((w) => {
              const isPaid = w.status === 'paid';
              const isApproved = w.status === 'approved';
              const isRejected = w.status === 'rejected';
              const cfg = isPaid ? { icon: CheckCircle2, cls: 'text-emerald-600' }
                        : isApproved ? { icon: Clock, cls: 'text-blue-600' }
                        : isRejected ? { icon: XCircle, cls: 'text-red-500' }
                        : { icon: Clock, cls: 'text-amber-500' };
              const Icon = cfg.icon;
              const label = tr.status[w.status] || w.status;
              return (
                <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${cfg.cls}`} />
                      {w.amount?.toFixed(2)}€
                      <Badge variant="outline" className={`text-[9px] ${cfg.cls} border-current`}>{label}</Badge>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{w.iban}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">{new Date(w.created_date).toLocaleDateString('pt-PT')}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}