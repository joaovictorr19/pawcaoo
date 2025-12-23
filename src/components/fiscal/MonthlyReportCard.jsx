import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  FileText, Download, Calendar, Euro, 
  Loader2, ChevronDown, ChevronUp, Receipt, TrendingUp
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";

export default function MonthlyReportCard() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: taxData } = useQuery({
    queryKey: ['myTaxData'],
    queryFn: async () => {
      const records = await base44.entities.ProfessionalTaxData.filter({ 
        professional_email: user?.email 
      });
      return records[0] || null;
    },
    enabled: !!user
  });

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['monthlyReport', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const reports = await base44.entities.MonthlyEarningsReport.filter({
        professional_email: user?.email,
        period_month: selectedMonth
      });
      return reports[0] || null;
    },
    enabled: !!user && !!selectedMonth
  });

  // Generate report from bookings
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      
      const [year, month] = selectedMonth.split('-');
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);

      // Fetch completed bookings for this period
      const allBookings = await base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'completed'
      });

      // Filter by date
      const periodBookings = allBookings.filter(b => {
        const bookingDate = new Date(b.walk_date || b.session_date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      // Also fetch training bookings
      const trainingBookings = await base44.entities.TrainingBooking.filter({
        trainer_email: user.email,
        status: 'completed'
      });

      const periodTraining = trainingBookings.filter(b => {
        const bookingDate = new Date(b.session_date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });

      const allPeriodBookings = [...periodBookings, ...periodTraining];

      // Calculate totals
      const vatRate = taxData?.is_vat_registered ? (taxData.vat_rate || 0) : 0;
      
      let grossEarnings = 0;
      let platformFees = 0;
      let tipsReceived = 0;
      let vatCollected = 0;

      const breakdown = allPeriodBookings.map(booking => {
        const gross = booking.service_amount || 0;
        const fee = booking.platform_fee || 0;
        const tip = booking.tip_amount || 0;
        const net = gross - fee;
        const vat = vatRate > 0 ? (net * vatRate / (100 + vatRate)) : 0;

        grossEarnings += gross;
        platformFees += fee;
        tipsReceived += tip;
        vatCollected += vat;

        return {
          booking_id: booking.id,
          date: booking.walk_date || booking.session_date,
          service_type: booking.type || 'walk',
          client_name: booking.owner_name || 'Cliente',
          gross_amount: gross,
          platform_fee: fee,
          net_amount: net,
          vat_amount: vat,
          tip_amount: tip
        };
      });

      const reportData = {
        professional_email: user.email,
        professional_name: user.full_name,
        period_month: selectedMonth,
        period_year: parseInt(year),
        country: taxData?.country || 'PT',
        total_bookings: allPeriodBookings.length,
        gross_earnings: grossEarnings,
        platform_fees: platformFees,
        net_earnings: grossEarnings - platformFees,
        tips_received: tipsReceived,
        vat_collected: vatCollected,
        vat_rate_applied: vatRate,
        bookings_breakdown: breakdown,
        status: 'finalized'
      };

      // Create or update report
      if (report?.id) {
        await base44.entities.MonthlyEarningsReport.update(report.id, reportData);
      } else {
        await base44.entities.MonthlyEarningsReport.create(reportData);
      }

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthlyReport', selectedMonth]);
      toast.success("Relatório gerado com sucesso!");
      setGenerating(false);
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
      setGenerating(false);
    }
  });

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const [year, month] = selectedMonth.split('-');
    const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: pt });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(22, 163, 74); // Green
    doc.text("PawCão", 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Relatório de Ganhos - ${monthName}`, 20, 35);

    // Professional Info
    doc.setFontSize(10);
    doc.text(`Profissional: ${report.professional_name}`, 20, 50);
    doc.text(`Email: ${report.professional_email}`, 20, 57);
    if (taxData?.tax_id) {
      doc.text(`${taxData.tax_id_type}: ${taxData.tax_id}`, 20, 64);
    }
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 71);

    // Summary Box
    doc.setFillColor(240, 253, 244);
    doc.rect(20, 80, 170, 50, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.rect(20, 80, 170, 50);

    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text("RESUMO DO PERÍODO", 95, 90, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Serviços: ${report.total_bookings}`, 30, 100);
    doc.text(`Ganhos Brutos: €${report.gross_earnings.toFixed(2)}`, 30, 108);
    doc.text(`Taxas Plataforma: €${report.platform_fees.toFixed(2)}`, 30, 116);
    
    doc.text(`Ganhos Líquidos: €${report.net_earnings.toFixed(2)}`, 110, 100);
    doc.text(`Gorjetas: €${report.tips_received.toFixed(2)}`, 110, 108);
    if (report.vat_collected > 0) {
      doc.text(`IVA Cobrado (${report.vat_rate_applied}%): €${report.vat_collected.toFixed(2)}`, 110, 116);
    }

    // Breakdown Table
    if (report.bookings_breakdown && report.bookings_breakdown.length > 0) {
      doc.setFontSize(12);
      doc.text("DETALHE DOS SERVIÇOS", 20, 145);

      doc.setFontSize(8);
      doc.setFillColor(229, 231, 235);
      doc.rect(20, 150, 170, 8, 'F');
      
      doc.text("Data", 22, 156);
      doc.text("Serviço", 50, 156);
      doc.text("Cliente", 80, 156);
      doc.text("Bruto", 120, 156);
      doc.text("Taxa", 140, 156);
      doc.text("Líquido", 160, 156);

      let y = 165;
      report.bookings_breakdown.forEach((item, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(format(new Date(item.date), 'dd/MM'), 22, y);
        doc.text(item.service_type === 'training' ? 'Treino' : 'Passeio', 50, y);
        doc.text(item.client_name.substring(0, 15), 80, y);
        doc.text(`€${item.gross_amount.toFixed(2)}`, 120, y);
        doc.text(`€${item.platform_fee.toFixed(2)}`, 140, y);
        doc.text(`€${item.net_amount.toFixed(2)}`, 160, y);
        
        y += 7;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Este documento é apenas informativo e não substitui documentos fiscais oficiais.", 105, 285, { align: 'center' });
    doc.text("Consulte o seu contabilista para declaração de rendimentos.", 105, 290, { align: 'center' });

    doc.save(`pawcao_relatorio_${selectedMonth}.pdf`);
    toast.success("PDF descarregado!");
  };

  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: pt })
    });
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-green-600" />
            Relatórios Mensais de Ganhos
          </CardTitle>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Relatórios detalhados para entregar ao seu contabilista
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Month Selector */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generating || loadingReport}
            variant="outline"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            {report ? 'Atualizar' : 'Gerar'} Relatório
          </Button>
        </div>

        {/* Report Summary */}
        {loadingReport ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : report ? (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{report.total_bookings}</p>
                <p className="text-xs text-blue-600">Serviços</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">€{report.gross_earnings?.toFixed(2)}</p>
                <p className="text-xs text-green-600">Bruto</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">€{report.platform_fees?.toFixed(2)}</p>
                <p className="text-xs text-red-600">Taxas</p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-700">€{report.net_earnings?.toFixed(2)}</p>
                <p className="text-xs text-emerald-600">Líquido</p>
              </div>
            </div>

            {/* Extra Info */}
            {(report.tips_received > 0 || report.vat_collected > 0) && (
              <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                {report.tips_received > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Gorjetas:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">€{report.tips_received.toFixed(2)}</Badge>
                  </div>
                )}
                {report.vat_collected > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">IVA ({report.vat_rate_applied}%):</span>
                    <Badge className="bg-purple-100 text-purple-800">€{report.vat_collected.toFixed(2)}</Badge>
                  </div>
                )}
              </div>
            )}

            {/* Breakdown Toggle */}
            {report.bookings_breakdown && report.bookings_breakdown.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full justify-between"
                >
                  <span>Ver Detalhe ({report.bookings_breakdown.length} serviços)</span>
                  {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showBreakdown && (
                  <div className="mt-3 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-left p-2">Cliente</th>
                          <th className="text-right p-2">Líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.bookings_breakdown.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{format(new Date(item.date), 'dd/MM')}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {item.service_type === 'training' ? 'Treino' : 'Passeio'}
                              </Badge>
                            </td>
                            <td className="p-2">{item.client_name}</td>
                            <td className="p-2 text-right font-semibold text-green-600">
                              €{item.net_amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Download Button */}
            <Button
              onClick={downloadPDF}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Descarregar PDF para Contabilista
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum relatório para este período</p>
            <p className="text-sm text-gray-400">Clique em "Gerar Relatório" para criar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}