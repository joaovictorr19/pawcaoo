import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const SERVICE_LABELS = {
  boarding: "Alojamento", daycare: "Creche", grooming: "Grooming",
  walk_with_partner: "Passeio", training: "Treino",
};
const STATUS_LABELS = {
  checked_in: "No Hotel", in_progress: "Em Progresso", confirmed: "Confirmado",
  pending: "Pendente", checked_out: "Check-out feito", completed: "Concluído",
};

function buildRows(bookings) {
  const rows = [];
  bookings.forEach(b => {
    const dogs = b.dogs?.length > 0 ? b.dogs : [{ dog_name: "—", dog_size: "", dog_breed: "" }];
    dogs.forEach(dog => {
      rows.push({
        animal: dog.dog_name || "—",
        raca: dog.dog_breed || "—",
        tamanho: SIZE_LABELS[dog.dog_size] || dog.dog_size || "—",
        dono: b.owner_name || "—",
        telefone: b.owner_phone || "—",
        email: b.owner_email || "—",
        servico: SERVICE_LABELS[b.service_type] || b.service_type || "—",
        checkin: b.checkin_date || "—",
        checkout: b.checkout_date || "—",
        status: STATUS_LABELS[b.status] || b.status || "—",
        vacinado: dog.special_notes ? "Ver notas" : "N/D",
        notas: dog.special_notes || b.special_requests || "—",
        valor: b.total_amount ? `${b.total_amount.toFixed(2)}€` : "—",
      });
    });
  });
  return rows;
}

function exportExcel(bookings) {
  const rows = buildRows(bookings);
  const headers = [
    "Animal", "Raça", "Tamanho", "Dono", "Telefone", "Email",
    "Serviço", "Check-in", "Check-out", "Status", "Vacinação", "Notas/Pedidos", "Valor"
  ];

  const csvContent = [
    headers.join(";"),
    ...rows.map(r => [
      r.animal, r.raca, r.tamanho, r.dono, r.telefone, r.email,
      r.servico, r.checkin, r.checkout, r.status, r.vacinado,
      `"${r.notas.replace(/"/g, '""')}"`, r.valor
    ].join(";"))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hospedes_hotel_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportPDF(bookings) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const margin = 10;
  const colWidths = [25, 25, 20, 30, 25, 22, 20, 20, 22, 20, 45, 16];
  const headers = ["Animal","Raça","Tamanho","Dono","Telefone","Serviço","Check-in","Check-out","Status","Vacinação","Notas","Valor"];
  const rows = buildRows(bookings);

  // Header bar
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Hotel Canino - Lista de Hospedes", margin, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 200, 13);

  const guests = bookings.filter(b => ["checked_in","in_progress"].includes(b.status));
  const confirmed = bookings.filter(b => b.status === "confirmed");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.text(`Total: ${bookings.length} | No hotel: ${guests.length} | A chegar: ${confirmed.length}`, margin, 26);

  // Table header
  let y = 30;
  const rowH = 7;
  doc.setFillColor(237, 233, 254);
  doc.rect(margin, y, pageW - margin * 2, rowH, "F");
  doc.setTextColor(80, 40, 160);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + 1, y + 5);
    x += colWidths[i];
  });
  y += rowH;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  rows.forEach((r, idx) => {
    if (y + rowH > 200) { doc.addPage(); y = 10; }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    }
    doc.setTextColor(50, 50, 50);
    x = margin;
    const cells = [r.animal, r.raca, r.tamanho, r.dono, r.telefone, r.servico, r.checkin, r.checkout, r.status, r.vacinado, r.notas.slice(0,50), r.valor];
    cells.forEach((cell, i) => {
      doc.text(String(cell), x + 1, y + 5, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });
    y += rowH;
  });

  doc.save(`hospedes_hotel_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export default function GuestsExportButton({ bookings }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (type) => {
    setLoading(true);
    try {
      if (type === "pdf") exportPDF(bookings);
      else exportExcel(bookings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || bookings.length === 0}
          className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700 rounded-xl text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200 shadow-lg">
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          className="gap-2 text-sm cursor-pointer rounded-lg"
        >
          <FileText className="w-4 h-4 text-red-500" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          className="gap-2 text-sm cursor-pointer rounded-lg"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Exportar Excel (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}