import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Building2, Calendar, Euro, Percent } from 'lucide-react';
import { format, parseISO, isSameMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SERVICE_LABELS = {
  boarding: 'Alojamento',
  daycare: 'Creche',
  grooming: 'Grooming',
  walk_with_partner: 'Passeio',
  training: 'Treino',
};

const PT_VAT_RATE = 23; // IVA normal em Portugal

export default function HotelFiscalReceipt({ hotelProfile, bookings }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const completedBookings = useMemo(() => {
    return (bookings || [])
      .filter(b => b.status === 'completed' && !['cancelled', 'rejected'].includes(b.status))
      .filter(b => {
        try { return isSameMonth(parseISO(b.checkin_date), selectedMonth); } catch { return false; }
      })
      .sort((a, b) => {
        try { return parseISO(a.checkin_date) - parseISO(b.checkin_date); } catch { return 0; }
      });
  }, [bookings, selectedMonth]);

  const totals = useMemo(() => {
    const gross = completedBookings.reduce((s, b) => s + (b.total_amount || 0), 0);
    const platformFee = completedBookings.reduce((s, b) => s + (b.platform_fee || 0), 0);
    const net = gross - platformFee;
    const vatBase = net; // Base tributável = valor líquido recebido pelo hotel
    const vatAmount = vatBase * (PT_VAT_RATE / 100);
    return { gross, platformFee, net, vatBase, vatAmount, count: completedBookings.length };
  }, [completedBookings]);

  // Dados fiscais do hotel
  const fiscalInfo = useMemo(() => {
    const hd = hotelProfile?.hotel_details || {};
    const name = hd.hotel_name || hotelProfile?.walker_name || '—';
    const address = hd.full_address || hotelProfile?.location || '—';
    const nif = hotelProfile?.tax_id_portugal || hotelProfile?.tax_id_spain || hotelProfile?.tax_id_france || '—';
    const iban = hotelProfile?.bank_account_number || '—';
    const holder = hotelProfile?.bank_account_holder || name;
    const country = hotelProfile?.country_of_operation || 'portugal';
    return { name, address, nif, iban, holder, country };
  }, [hotelProfile]);

  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      months.push(d);
    }
    return months;
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodLabel = format(selectedMonth, 'MMMM yyyy', { locale: pt });

    // Header — Platform
    doc.setFillColor(13, 148, 131); // teal
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PawCão', 14, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma de Serviços Caninos', 14, 18);
    doc.setFontSize(9);
    doc.text(`Recibo Fiscal de Serviços`, pageWidth - 14, 12, { align: 'right' });
    doc.text(`Período: ${periodLabel}`, pageWidth - 14, 18, { align: 'right' });

    // Hotel billing block
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Prestador de Serviços', 14, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nome: ${fiscalInfo.name}`, 14, 47);
    doc.text(`NIF: ${fiscalInfo.nif}`, 14, 53);
    doc.text(`Morada: ${fiscalInfo.address}`, 14, 59);
    doc.text(`Titular da Conta: ${fiscalInfo.holder}`, 14, 65);
    doc.text(`IBAN: ${fiscalInfo.iban}`, 14, 71);
    doc.text(`País: ${fiscalInfo.country === 'portugal' ? 'Portugal' : fiscalInfo.country}`, 14, 77);

    // Right column — period info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Data de Emissão:', pageWidth - 14, 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 14, 45, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Nº Transações:', pageWidth - 14, 52, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(String(totals.count), pageWidth - 14, 57, { align: 'right' });

    // Transactions table
    autoTable(doc, {
      startY: 85,
      head: [['Data', 'Cliente', 'Serviço', 'Bruto (€)', 'Taxa (€)', 'Líquido (€)']],
      body: completedBookings.map(b => [
        b.checkin_date ? format(parseISO(b.checkin_date), 'dd/MM/yyyy') : '—',
        b.owner_name || '—',
        SERVICE_LABELS[b.service_type] || b.service_type || '—',
        (b.total_amount || 0).toFixed(2),
        (b.platform_fee || 0).toFixed(2),
        ((b.total_amount || 0) - (b.platform_fee || 0)).toFixed(2),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 131], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    // Summary
    let summaryY = doc.lastAutoTable.finalY + 12;
    const summaryX = pageWidth - 90;

    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, summaryY - 4, pageWidth - 14, summaryY - 4);

    const summaryRows = [
      ['Receita Bruta', `${totals.gross.toFixed(2)} €`],
      ['Comissão PawCão', `- ${totals.platformFee.toFixed(2)} €`],
      ['Valor Líquido (Base Tributável)', `${totals.net.toFixed(2)} €`],
      [`IVA (${PT_VAT_RATE}%)`, `${totals.vatAmount.toFixed(2)} €`],
    ];

    summaryRows.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(label, summaryX, summaryY + i * 6);
      doc.text(value, pageWidth - 14, summaryY + i * 6, { align: 'right' });
    });

    const totalY = summaryY + summaryRows.length * 6 + 2;
    doc.setFillColor(13, 148, 131);
    doc.rect(summaryX, totalY, pageWidth - 14 - summaryX, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total a Declarar (c/ IVA)', summaryX + 2, totalY + 7);
    doc.text(`${(totals.net + totals.vatAmount).toFixed(2)} €`, pageWidth - 16, totalY + 7, { align: 'right' });

    // Footer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Este documento serve como resumo fiscal dos serviços prestados através da plataforma PawCão.',
      14, doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      'Deve ser utilizado em conjunto com o software de faturação certificado (ex: InvoiceXpress, Moloni).',
      14, doc.internal.pageSize.getHeight() - 6
    );

    const fileName = `recibo-fiscal-${fiscalInfo.name.replace(/\s+/g, '-').toLowerCase()}-${format(selectedMonth, 'MM-yyyy')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recibo Fiscal para Fisco</h3>
            <p className="text-[10px] text-slate-400">Resumo fiscal completo para declaração de IRS/IVA</p>
          </div>
        </div>
        <Button onClick={generatePDF} disabled={completedBookings.length === 0}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs gap-1.5 h-9">
          <Download className="w-3.5 h-3.5" /> Exportar PDF
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {monthOptions.map(m => {
          const isActive = format(m, 'MM-yyyy') === format(selectedMonth, 'MM-yyyy');
          return (
            <button key={format(m, 'MM-yyyy')} onClick={() => setSelectedMonth(m)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {format(m, 'MMM yyyy', { locale: pt })}
            </button>
          );
        })}
      </div>

      {/* Hotel billing info preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Dados de Faturação</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
          <p className="text-slate-700"><span className="text-slate-400">Nome:</span> {fiscalInfo.name}</p>
          <p className="text-slate-700"><span className="text-slate-400">NIF:</span> {fiscalInfo.nif}</p>
          <p className="text-slate-700 sm:col-span-2"><span className="text-slate-400">Morada:</span> {fiscalInfo.address}</p>
          <p className="text-slate-700"><span className="text-slate-400">Titular:</span> {fiscalInfo.holder}</p>
          <p className="text-slate-700"><span className="text-slate-400">IBAN:</span> <span className="font-mono text-[11px]">{fiscalInfo.iban}</span></p>
        </div>
      </div>

      {/* Summary */}
      {completedBookings.length === 0 ? (
        <div className="py-6 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Sem serviços concluídos neste período</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <p className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1"><Euro className="w-3 h-3" /> Bruto</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{totals.gross.toFixed(2)}€</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
            <p className="text-[9px] font-bold uppercase text-red-400 flex items-center gap-1"><Percent className="w-3 h-3" /> Taxa</p>
            <p className="text-base font-black text-red-600 mt-0.5">{totals.platformFee.toFixed(2)}€</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
            <p className="text-[9px] font-bold uppercase text-emerald-400 flex items-center gap-1"><Euro className="w-3 h-3" /> Líquido</p>
            <p className="text-base font-black text-emerald-600 mt-0.5">{totals.net.toFixed(2)}€</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5">
            <p className="text-[9px] font-bold uppercase text-teal-400 flex items-center gap-1"><Percent className="w-3 h-3" /> IVA {PT_VAT_RATE}%</p>
            <p className="text-base font-black text-teal-600 mt-0.5">{totals.vatAmount.toFixed(2)}€</p>
          </div>
        </div>
      )}

      {completedBookings.length > 0 && (
        <div className="flex items-center justify-between bg-teal-600 text-white rounded-lg px-3 py-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Total a Declarar (c/ IVA)</p>
            <p className="text-[10px] opacity-70">{totals.count} transação(ões) · {format(selectedMonth, 'MMMM yyyy', { locale: pt })}</p>
          </div>
          <p className="text-xl font-black">{(totals.net + totals.vatAmount).toFixed(2)}€</p>
        </div>
      )}
    </div>
  );
}