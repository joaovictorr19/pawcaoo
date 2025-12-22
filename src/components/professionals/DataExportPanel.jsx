import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DataExportPanel({ professionalEmail, country }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ['professionalBookings', professionalEmail],
    queryFn: async () => {
      const walks = await base44.entities.Booking.filter({ 
        walker_email: professionalEmail,
        status: 'completed'
      }, '-walk_date', 500);

      const trainings = await base44.entities.TrainingBooking.filter({ 
        trainer_email: professionalEmail,
        status: 'completed'
      }, '-session_date', 500);

      return [...walks, ...trainings].sort((a, b) => 
        new Date(b.walk_date || b.session_date) - new Date(a.walk_date || a.session_date)
      );
    },
    enabled: !!professionalEmail,
    initialData: []
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['professionalPayments', professionalEmail],
    queryFn: async () => {
      return await base44.entities.Payment.filter({ 
        recipient_email: professionalEmail,
        status: 'released'
      }, '-released_date', 500);
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

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Sem dados para exportar neste período");
      return;
    }

    setIsExporting(true);

    const headers = [
      "Data do Serviço",
      "Nome do Cliente",
      "Tipo de Serviço",
      "Valor Bruto (€)",
      "Taxa da Plataforma (€)",
      "Valor Líquido (€)",
      "ID da Transação",
      "Status de Pagamento"
    ];

    const rows = filteredData.map(booking => {
      const payment = payments.find(p => p.booking_id === booking.id);
      
      return [
        format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy'),
        booking.owner_name || 'N/A',
        booking.trainer_name ? 'Treino' : 'Passeio',
        (booking.total_amount || 0).toFixed(2),
        (payment?.platform_fee || 0).toFixed(2),
        (payment?.service_amount || 0).toFixed(2),
        payment?.id || booking.id,
        payment?.status || 'pending'
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `pawcao_financas_${selectedYear}${selectedMonth !== 'all' ? `_${selectedMonth}` : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    toast.success("Ficheiro CSV exportado com sucesso!");
  };

  const getTaxGuidance = () => {
    switch(country) {
      case 'portugal':
        return "📄 Este ficheiro pode ser usado para preencher o Anexo B (Rendimentos de Trabalho Independente) do IRS em Portugal.";
      case 'spain':
        return "📄 Este ficheiro serve para declarar rendimentos na Hacienda (Modelo 130/303) em Espanha.";
      case 'france':
        return "📄 Este ficheiro pode ser usado para declarar rendimentos CESU ou declarações URSSAF em França.";
      default:
        return "📄 Este ficheiro contém o seu histórico financeiro completo.";
    }
  };

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

  return (
    <Card className="glass-panel border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Meus Dados e Finanças
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">{getTaxGuidance()}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">€{totalGross.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Valor Bruto</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">-€{totalFees.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Taxas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">€{totalNet.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Valor Líquido</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>{filteredData.length}</strong> serviço{filteredData.length !== 1 ? 's' : ''} completado{filteredData.length !== 1 ? 's' : ''} neste período
          </p>
        </div>

        {/* Export Button */}
        <Button
          onClick={exportToCSV}
          disabled={isExporting || filteredData.length === 0}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold h-12"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Exportar para CSV (IRS/Hacienda/URSSAF)
            </>
          )}
        </Button>

        {/* Additional Info by Country */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">ℹ️ Informação Útil</h4>
          {country === 'portugal' && (
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Anexo B do IRS: Rendimentos de Prestação de Serviços</li>
              <li>Categoria: Recibos Verdes (Trabalhador Independente)</li>
              <li>Dedução: 25% de despesas (regime simplificado)</li>
            </ul>
          )}
          {country === 'spain' && (
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Modelo 130: Declaração trimestral de IRPF (autónomos)</li>
              <li>Modelo 303: IVA trimestral (se aplicável)</li>
              <li>Rendimentos: Atividade Económica - Serviços</li>
            </ul>
          )}
          {country === 'france' && (
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>CESU: Declaração de serviços domésticos (se particular)</li>
              <li>URSSAF: Contribuições sociais (se auto-entrepreneur)</li>
              <li>Auto-entrepreneur: Regime Micro-BNC/Micro-BIC</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}