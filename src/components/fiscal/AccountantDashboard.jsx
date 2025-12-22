import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  FileText, Download, Calendar, Euro, Search, 
  Loader2, CheckCircle, AlertCircle, ExternalLink,
  Filter, RefreshCw
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";

export default function AccountantDashboard() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['myInvoices', selectedMonth],
    queryFn: async () => {
      const allInvoices = await base44.entities.Invoice.filter({
        professional_email: user?.email
      }, '-created_date');
      
      // Filter by month
      const [year, month] = selectedMonth.split('-');
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);
      
      return allInvoices.filter(inv => {
        const invDate = new Date(inv.service_date || inv.created_date);
        return invDate >= startDate && invDate <= endDate;
      });
    },
    enabled: !!user
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

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch = !searchTerm || 
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.service_description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totals = filteredInvoices.reduce((acc, inv) => ({
    gross: acc.gross + (inv.gross_amount || 0),
    fees: acc.fees + (inv.platform_fee || 0),
    net: acc.net + (inv.net_amount || 0),
    vat: acc.vat + (inv.vat_amount || 0),
    count: acc.count + 1
  }), { gross: 0, fees: 0, net: 0, vat: 0, count: 0 });

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendente" },
      generated: { color: "bg-green-100 text-green-800", label: "Gerada" },
      sent: { color: "bg-blue-100 text-blue-800", label: "Enviada" },
      paid: { color: "bg-emerald-100 text-emerald-800", label: "Paga" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelada" },
      error: { color: "bg-red-100 text-red-800", label: "Erro" }
    };
    const c = config[status] || config.pending;
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const downloadInvoicePDF = (invoice) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
      return;
    }

    // Generate simple PDF
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(22, 163, 74);
    doc.text("PawCão", 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Recibo de Serviço`, 20, 35);
    doc.text(`Nº: ${invoice.invoice_number}`, 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Data: ${format(new Date(invoice.service_date || invoice.created_date), 'dd/MM/yyyy')}`, 20, 60);
    doc.text(`Profissional: ${invoice.professional_name}`, 20, 70);
    doc.text(`NIF: ${invoice.professional_tax_id || 'N/A'}`, 20, 77);
    doc.text(`Cliente: ${invoice.client_name}`, 20, 90);
    
    doc.setFillColor(240, 253, 244);
    doc.rect(20, 100, 170, 40, 'F');
    
    doc.text(`Serviço: ${invoice.service_description}`, 25, 112);
    doc.text(`Valor Bruto: €${(invoice.gross_amount || 0).toFixed(2)}`, 25, 122);
    doc.text(`Taxa Plataforma: €${(invoice.platform_fee || 0).toFixed(2)}`, 25, 132);
    
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text(`Valor Líquido: €${(invoice.net_amount || 0).toFixed(2)}`, 25, 145);
    
    if (invoice.vat_amount > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`IVA (${invoice.vat_rate}%): €${invoice.vat_amount.toFixed(2)}`, 120, 145);
    }

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Documento gerado automaticamente pela plataforma PawCão", 105, 280, { align: 'center' });
    
    doc.save(`recibo_${invoice.invoice_number}.pdf`);
  };

  const downloadAllPDF = () => {
    const doc = new jsPDF();
    const [year, month] = selectedMonth.split('-');
    const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: pt });
    
    doc.setFontSize(18);
    doc.setTextColor(22, 163, 74);
    doc.text("PawCão - Relatório Contabilístico", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(monthName, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Profissional: ${user?.full_name}`, 20, 45);
    doc.text(`NIF: ${taxData?.tax_id || 'N/A'}`, 20, 52);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 59);
    
    // Summary
    doc.setFillColor(240, 253, 244);
    doc.rect(20, 65, 170, 30, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.rect(20, 65, 170, 30);
    
    doc.text(`Total Serviços: ${totals.count}`, 30, 77);
    doc.text(`Bruto: €${totals.gross.toFixed(2)}`, 30, 85);
    doc.text(`Taxas: €${totals.fees.toFixed(2)}`, 90, 77);
    doc.text(`Líquido: €${totals.net.toFixed(2)}`, 90, 85);
    if (totals.vat > 0) {
      doc.text(`IVA: €${totals.vat.toFixed(2)}`, 150, 77);
    }
    
    // Table header
    let y = 105;
    doc.setFillColor(229, 231, 235);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFontSize(8);
    doc.text("Data", 22, y + 6);
    doc.text("Nº Fatura", 45, y + 6);
    doc.text("Cliente", 75, y + 6);
    doc.text("Bruto", 115, y + 6);
    doc.text("Taxa", 135, y + 6);
    doc.text("Líquido", 155, y + 6);
    doc.text("Estado", 175, y + 6);
    
    y += 12;
    
    filteredInvoices.forEach((inv) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(format(new Date(inv.service_date || inv.created_date), 'dd/MM'), 22, y);
      doc.text((inv.invoice_number || '').substring(0, 12), 45, y);
      doc.text((inv.client_name || '').substring(0, 15), 75, y);
      doc.text(`€${(inv.gross_amount || 0).toFixed(2)}`, 115, y);
      doc.text(`€${(inv.platform_fee || 0).toFixed(2)}`, 135, y);
      doc.text(`€${(inv.net_amount || 0).toFixed(2)}`, 155, y);
      doc.text(inv.status === 'generated' ? 'OK' : inv.status?.substring(0, 4) || '', 175, y);
      
      y += 7;
    });
    
    doc.save(`relatorio_contabilistico_${selectedMonth}.pdf`);
    toast.success("Relatório exportado!");
  };

  // Month options
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
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
              Painel do Contabilista
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Todas as faturas e recibos para declaração fiscal
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            <Button 
              onClick={downloadAllPDF}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar Tudo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nº, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="generated">Geradas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="error">Com Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-700">{totals.count}</p>
            <p className="text-xs text-blue-600">Serviços</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xl font-bold text-gray-700">€{totals.gross.toFixed(2)}</p>
            <p className="text-xs text-gray-600">Bruto</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-xl font-bold text-red-700">€{totals.fees.toFixed(2)}</p>
            <p className="text-xs text-red-600">Taxa PawCão</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg text-center">
            <p className="text-xl font-bold text-green-700">€{totals.net.toFixed(2)}</p>
            <p className="text-xs text-green-600">Líquido</p>
          </div>
          {totals.vat > 0 && (
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-xl font-bold text-purple-700">€{totals.vat.toFixed(2)}</p>
              <p className="text-xs text-purple-600">IVA</p>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma fatura encontrada</p>
            <p className="text-sm text-gray-400">Complete serviços para gerar faturas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Data</TableHead>
                  <TableHead>Nº Fatura</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {format(new Date(invoice.service_date || invoice.created_date), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {invoice.invoice_number?.substring(0, 15)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {invoice.client_name?.substring(0, 20)}
                    </TableCell>
                    <TableCell className="text-right">
                      €{(invoice.gross_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-red-600">
                      €{(invoice.platform_fee || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      €{(invoice.net_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadInvoicePDF(invoice)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}