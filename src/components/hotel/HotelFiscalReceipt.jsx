import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Building2, Calendar, Euro, Percent } from 'lucide-react';
import { format, parseISO, isSameMonth, subMonths } from 'date-fns';
import { pt, es, fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/components/LanguageContext';

// === Country-specific fiscal config ===
const COUNTRY_CONFIG = {
  portugal: {
    vatRate: 23,
    vatLabel: 'IVA',
    taxIdLabel: 'NIF',
    taxIdField: 'tax_id_portugal',
    countryName: { pt: 'Portugal', es: 'Portugal', fr: 'Portugal' },
    locale: pt,
  },
  spain: {
    vatRate: 21,
    vatLabel: 'IVA',
    taxIdLabel: 'NIE/NIF',
    taxIdField: 'tax_id_spain',
    countryName: { pt: 'Espanha', es: 'España', fr: 'Espagne' },
    locale: es,
  },
  france: {
    vatRate: 20,
    vatLabel: 'TVA',
    taxIdLabel: 'SIRET',
    taxIdField: 'tax_id_france',
    countryName: { pt: 'França', es: 'Francia', fr: 'France' },
    locale: fr,
  },
};

// === Translations (pt / es / fr) ===
const I18N = {
  pt: {
    title: 'Recibo Fiscal para Fisco',
    subtitle: 'Resumo fiscal completo para declaração',
    export: 'Exportar PDF',
    billingData: 'Dados de Faturação',
    name: 'Nome',
    taxId: 'NIF',
    address: 'Morada',
    holder: 'Titular da Conta',
    iban: 'IBAN',
    country: 'País',
    issuanceDate: 'Data de Emissão',
    txCount: 'Nº Transações',
    date: 'Data',
    client: 'Cliente',
    service: 'Serviço',
    gross: 'Bruto',
    fee: 'Taxa',
    net: 'Líquido',
    grossRevenue: 'Receita Bruta',
    platformFee: 'Comissão PawCão',
    netTaxable: 'Valor Líquido (Base Tributável)',
    vatAmount: lbl => `${lbl} (${COUNTRY_CONFIG.portugal.vatRate}%)`,
    totalDeclare: 'Total a Declarar (c/ IVA)',
    transactions: 'transação(ões)',
    noServices: 'Sem serviços concluídos neste período',
    grossShort: 'Bruto',
    feeShort: 'Taxa',
    netShort: 'Líquido',
    pdfTitle: 'Recibo Fiscal de Serviços',
    period: 'Período',
    footer1: 'Este documento serve como resumo fiscal dos serviços prestados através da plataforma PawCão.',
    footer2: 'Deve ser utilizado em conjunto com o software de faturação certificado.',
    serviceName: 'PawCão — Plataforma de Serviços Caninos',
    services: {
      boarding: 'Alojamento', daycare: 'Creche', grooming: 'Grooming',
      walk_with_partner: 'Passeio', training: 'Treino',
    },
  },
  es: {
    title: 'Recibo Fiscal para Hacienda',
    subtitle: 'Resumen fiscal completo para declaración',
    export: 'Exportar PDF',
    billingData: 'Datos de Facturación',
    name: 'Nombre',
    taxId: 'NIE/NIF',
    address: 'Dirección',
    holder: 'Titular de la Cuenta',
    iban: 'IBAN',
    country: 'País',
    issuanceDate: 'Fecha de Emisión',
    txCount: 'Nº Transacciones',
    date: 'Fecha',
    client: 'Cliente',
    service: 'Servicio',
    gross: 'Bruto',
    fee: 'Comisión',
    net: 'Líquido',
    grossRevenue: 'Ingresos Brutos',
    platformFee: 'Comisión PawCão',
    netTaxable: 'Valor Líquido (Base Imponible)',
    vatAmount: lbl => `${lbl} (${COUNTRY_CONFIG.spain.vatRate}%)`,
    totalDeclare: 'Total a Declarar (c/ IVA)',
    transactions: 'transacción(es)',
    noServices: 'Sin servicios completados en este período',
    grossShort: 'Bruto',
    feeShort: 'Comisión',
    netShort: 'Líquido',
    pdfTitle: 'Recibo Fiscal de Servicios',
    period: 'Período',
    footer1: 'Este documento sirve como resumen fiscal de los servicios prestados a través de la plataforma PawCão.',
    footer2: 'Debe utilizarse junto con el software de facturación certificado.',
    serviceName: 'PawCão — Plataforma de Servicios Caninos',
    services: {
      boarding: 'Alojamiento', daycare: 'Guardería', grooming: 'Grooming',
      walk_with_partner: 'Paseo', training: 'Adiestramiento',
    },
  },
  fr: {
    title: 'Reçu Fiscal pour l’Administration',
    subtitle: 'Résumé fiscal complet pour déclaration',
    export: 'Exporter PDF',
    billingData: 'Données de Facturation',
    name: 'Nom',
    taxId: 'SIRET',
    address: 'Adresse',
    holder: 'Titulaire du Compte',
    iban: 'IBAN',
    country: 'Pays',
    issuanceDate: 'Date d’Émission',
    txCount: 'Nº Transactions',
    date: 'Date',
    client: 'Client',
    service: 'Service',
    gross: 'Brut',
    fee: 'Commission',
    net: 'Net',
    grossRevenue: 'Revenu Brut',
    platformFee: 'Commission PawCão',
    netTaxable: 'Valeur Nette (Base Imposable)',
    vatAmount: lbl => `${lbl} (${COUNTRY_CONFIG.france.vatRate}%)`,
    totalDeclare: 'Total à Déclarer (TVA incl.)',
    transactions: 'transaction(s)',
    noServices: 'Aucun service terminé sur cette période',
    grossShort: 'Brut',
    feeShort: 'Commission',
    netShort: 'Net',
    pdfTitle: 'Reçu Fiscal de Services',
    period: 'Période',
    footer1: 'Ce document sert de résumé fiscal des services prestés via la plateforme PawCão.',
    footer2: 'Doit être utilisé conjointement avec un logiciel de facturation certifié.',
    serviceName: 'PawCão — Plateforme de Services Canins',
    services: {
      boarding: 'Pension', daycare: 'Garde', grooming: 'Toilettage',
      walk_with_partner: 'Promenade', training: 'Dressage',
    },
  },
};

export default function HotelFiscalReceipt({ hotelProfile, bookings }) {
  const { language } = useLanguage();
  const lang = ['pt', 'es', 'fr'].includes(language) ? language : 'pt';
  const tr = I18N[lang];
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const country = hotelProfile?.country_of_operation || 'portugal';
  const countryCfg = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.portugal;
  const dateLocale = countryCfg.locale;

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
    const vatBase = net;
    const vatAmount = vatBase * (countryCfg.vatRate / 100);
    return { gross, platformFee, net, vatBase, vatAmount, count: completedBookings.length };
  }, [completedBookings, countryCfg]);

  const fiscalInfo = useMemo(() => {
    const hd = hotelProfile?.hotel_details || {};
    const name = hd.hotel_name || hotelProfile?.walker_name || '—';
    const address = hd.full_address || hotelProfile?.location || '—';
    const taxId = hotelProfile?.[countryCfg.taxIdField] || '—';
    const iban = hotelProfile?.bank_account_number || '—';
    const holder = hotelProfile?.bank_account_holder || name;
    return { name, address, taxId, iban, holder };
  }, [hotelProfile, countryCfg]);

  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) months.push(subMonths(new Date(), i));
    return months;
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodLabel = format(selectedMonth, 'MMMM yyyy', { locale: dateLocale });

    // Header
    doc.setFillColor(13, 148, 131);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PawCão', 14, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(tr.serviceName, 14, 18);
    doc.setFontSize(9);
    doc.text(tr.pdfTitle, pageWidth - 14, 12, { align: 'right' });
    doc.text(`${tr.period}: ${periodLabel}`, pageWidth - 14, 18, { align: 'right' });

    // Billing block
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(tr.billingData, 14, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let y = 47;
    const lines = [
      `${tr.name}: ${fiscalInfo.name}`,
      `${countryCfg.taxIdLabel}: ${fiscalInfo.taxId}`,
      `${tr.address}: ${fiscalInfo.address}`,
      `${tr.holder}: ${fiscalInfo.holder}`,
      `${tr.iban}: ${fiscalInfo.iban}`,
      `${tr.country}: ${countryCfg.countryName[lang]}`,
    ];
    lines.forEach(l => { doc.text(l, 14, y); y += 6; });

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${tr.issuanceDate}:`, pageWidth - 14, 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 14, 45, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${tr.txCount}:`, pageWidth - 14, 52, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(String(totals.count), pageWidth - 14, 57, { align: 'right' });

    // Transactions table
    autoTable(doc, {
      startY: 85,
      head: [[tr.date, tr.client, tr.service, `${tr.gross} (€)`, `${tr.fee} (€)`, `${tr.net} (€)`]],
      body: completedBookings.map(b => [
        b.checkin_date ? format(parseISO(b.checkin_date), 'dd/MM/yyyy') : '—',
        b.owner_name || '—',
        tr.services[b.service_type] || b.service_type || '—',
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
      [tr.grossRevenue, `${totals.gross.toFixed(2)} €`],
      [tr.platformFee, `- ${totals.platformFee.toFixed(2)} €`],
      [tr.netTaxable, `${totals.net.toFixed(2)} €`],
      [tr.vatAmount(countryCfg.vatLabel), `${totals.vatAmount.toFixed(2)} €`],
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
    doc.text(tr.totalDeclare, summaryX + 2, totalY + 7);
    doc.text(`${(totals.net + totals.vatAmount).toFixed(2)} €`, pageWidth - 16, totalY + 7, { align: 'right' });

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(tr.footer1, 14, doc.internal.pageSize.getHeight() - 10);
    doc.text(tr.footer2, 14, doc.internal.pageSize.getHeight() - 6);

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
            <h3 className="text-sm font-bold text-slate-900">{tr.title}</h3>
            <p className="text-[10px] text-slate-400">{tr.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400">{countryCfg.countryName[lang]}</span>
          <span className="text-[10px] font-bold text-teal-600">{countryCfg.vatLabel} {countryCfg.vatRate}%</span>
          <Button onClick={generatePDF} disabled={completedBookings.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs gap-1.5 h-9">
            <Download className="w-3.5 h-3.5" /> {tr.export}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {monthOptions.map(m => {
          const isActive = format(m, 'MM-yyyy') === format(selectedMonth, 'MM-yyyy');
          return (
            <button key={format(m, 'MM-yyyy')} onClick={() => setSelectedMonth(m)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {format(m, 'MMM yyyy', { locale: dateLocale })}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{tr.billingData}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
          <p className="text-slate-700"><span className="text-slate-400">{tr.name}:</span> {fiscalInfo.name}</p>
          <p className="text-slate-700"><span className="text-slate-400">{countryCfg.taxIdLabel}:</span> {fiscalInfo.taxId}</p>
          <p className="text-slate-700 sm:col-span-2"><span className="text-slate-400">{tr.address}:</span> {fiscalInfo.address}</p>
          <p className="text-slate-700"><span className="text-slate-400">{tr.holder}:</span> {fiscalInfo.holder}</p>
          <p className="text-slate-700"><span className="text-slate-400">{tr.iban}:</span> <span className="font-mono text-[11px]">{fiscalInfo.iban}</span></p>
        </div>
      </div>

      {completedBookings.length === 0 ? (
        <div className="py-6 text-center">
          <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{tr.noServices}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1"><Euro className="w-3 h-3" /> {tr.grossShort}</p>
              <p className="text-base font-black text-slate-800 mt-0.5">{totals.gross.toFixed(2)}€</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase text-red-400 flex items-center gap-1"><Percent className="w-3 h-3" /> {tr.feeShort}</p>
              <p className="text-base font-black text-red-600 mt-0.5">{totals.platformFee.toFixed(2)}€</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase text-emerald-400 flex items-center gap-1"><Euro className="w-3 h-3" /> {tr.netShort}</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">{totals.net.toFixed(2)}€</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5">
              <p className="text-[9px] font-bold uppercase text-teal-400 flex items-center gap-1"><Percent className="w-3 h-3" /> {countryCfg.vatLabel} {countryCfg.vatRate}%</p>
              <p className="text-base font-black text-teal-600 mt-0.5">{totals.vatAmount.toFixed(2)}€</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-teal-600 text-white rounded-lg px-3 py-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{tr.totalDeclare}</p>
              <p className="text-[10px] opacity-70">{totals.count} {tr.transactions} · {format(selectedMonth, 'MMMM yyyy', { locale: dateLocale })}</p>
            </div>
            <p className="text-xl font-black">{(totals.net + totals.vatAmount).toFixed(2)}€</p>
          </div>
        </>
      )}
    </div>
  );
}