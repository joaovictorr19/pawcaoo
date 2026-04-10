import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DataExportInline({ professionalEmail, country }) {
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState("all");
  const [isExporting, setIsExporting] = React.useState(false);
  const currency = React.useMemo(() => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }), []);

  const { data: bookings = [] } = useQuery({
    queryKey: ['exportInlineBookings', professionalEmail],
    queryFn: async () => {
      const walks = await base44.entities.Booking.filter({ 
        walker_email: professionalEmail,
        status: 'completed'
      }, '-walk_date', 500);

      let trainings = [];
      try {
        trainings = await base44.entities.TrainingBooking.filter({ 
          trainer_email: professionalEmail,
          status: 'completed'
        }, '-session_date', 500);
      } catch (_) { /* optional entity */ }

      return [...walks, ...trainings].sort((a, b) => 
        new Date(b.walk_date || b.session_date) - new Date(a.walk_date || a.session_date)
      );
    },
    enabled: !!professionalEmail,
    initialData: []
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['exportInlinePayments', professionalEmail],
    queryFn: async () => {
      try {
        return await base44.entities.Payment.filter({ 
          recipient_email: professionalEmail,
          status: 'released'
        }, '-released_date', 500);
      } catch (_) { return []; }
    },
    enabled: !!professionalEmail,
    initialData: []
  });

  const filteredData = React.useMemo(() => {
    return bookings.filter(booking => {
      const date = new Date(booking.walk_date || booking.session_date);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString();
      if (year !== selectedYear) return false;
      if (selectedMonth !== 'all' && month !== selectedMonth) return false;
      return true;
    });
  }, [bookings, selectedYear, selectedMonth]);

  const totalGross = filteredData.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalFees = filteredData.reduce((sum, b) => {
    const payment = payments.find(p => p.booking_id === b.id);
    return sum + (payment?.platform_fee || 0);
  }, 0);
  const totalNet = totalGross - totalFees;

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: 'all', label: 'Ano Completo' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Sem dados para exportar neste período");
      return;
    }
    setIsExporting(true);

    const headers = [
      'Data do Serviço','Cliente','Tipo','Valor Bruto (€)','Taxa Plataforma (€)','Valor Líquido (€)','Transação','Estado'
    ];

    const rows = filteredData.map(booking => {
      const payment = payments.find(p => p.booking_id === booking.id);
      const gross = (booking.total_amount || 0);
      const fee = (payment?.platform_fee || 0);
      const net = (payment?.service_amount || (gross - fee));
      return [
        format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy'),
        booking.owner_name || 'N/A',
        booking.trainer_name ? 'Treino' : 'Passeio',
        gross.toFixed(2),
        fee.toFixed(2),
        net.toFixed(2),
        payment?.id || booking.id,
        payment?.status || 'pending'
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pawcao_export_${selectedYear}${selectedMonth !== 'all' ? `_${selectedMonth}` : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Ano</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="bg-slate-900 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Mês</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="bg-slate-900 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="text-lg font-bold text-amber-400">{currency.format(totalGross)}</div>
          <div className="text-xs text-slate-400">Valor Bruto</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">-{currency.format(totalFees)}</div>
          <div className="text-xs text-slate-400">Taxas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{currency.format(totalNet)}</div>
          <div className="text-xs text-slate-400">Valor Líquido</div>
        </div>
      </div>

      {/* Pré-visualização */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-slate-900/80 px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
          <span>{filteredData.length} registo{filteredData.length !== 1 ? 's' : ''} no período</span>
          <span>Mostrando até 10</span>
        </div>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 sticky top-0">
              <tr className="text-left text-slate-400">
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2 text-right">Bruto</th>
                <th className="px-3 py-2 text-right">Taxa</th>
                <th className="px-3 py-2 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 10).map((b) => {
                const payment = payments.find(p => p.booking_id === b.id);
                const gross = (b.total_amount || 0);
                const fee = (payment?.platform_fee || 0);
                const net = (payment?.service_amount || (gross - fee));
                return (
                  <tr key={b.id} className="odd:bg-slate-950 even:bg-slate-900">
                    <td className="px-3 py-2 text-slate-200">{format(new Date(b.walk_date || b.session_date), 'dd/MM/yyyy')}</td>
                    <td className="px-3 py-2 text-slate-200">{b.owner_name || 'N/A'}</td>
                    <td className="px-3 py-2 text-slate-200">{b.trainer_name ? 'Treino' : 'Passeio'}</td>
                    <td className="px-3 py-2 text-right text-slate-100">{currency.format(gross)}</td>
                    <td className="px-3 py-2 text-right text-slate-100">{currency.format(fee)}</td>
                    <td className="px-3 py-2 text-right text-slate-100">{currency.format(net)}</td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>Sem registos neste período</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exportar */}
      <Button onClick={exportToCSV} disabled={isExporting || filteredData.length === 0} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-10 rounded-lg">
        {isExporting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...</>) : (<><Download className="w-4 h-4 mr-2" /> Exportar CSV</>)}
      </Button>
    </div>
  );
}