import React, { useState } from "react";
import { Download, FileText, Sheet } from "lucide-react";
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
import "jspdf-autotable";

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

  // Header
  doc.setFillColor(124, 58, 237); // purple-600
  doc.rect(0, 0, 297, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("🐾 Hotel Canino — Lista de Hóspedes", 10, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}`, 200, 13);

  // Stats bar
  const guests = bookings.filter(b => ["checked_in", "in_progress"].includes(b.status));
  const confirmed = bookings.filter(b => b.status === "confirmed");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`Total exportado: ${bookings.length} reservas | No hotel: ${guests.length} | A chegar: ${confirmed.length}`, 10, 27);

  const rows = buildRows(bookings);
  const tableData = rows.map(r => [
    r.animal, r.raca, r.tamanho, r.dono, r.telefone,
    r.servico, r.checkin, r.checkout, r.status, r.vacinado, r.notas, r.valor
  ]);

  doc.autoTable({
    startY: 30,
    head: [[
      "Animal", "Raça", "Tamanho", "Dono", "Telefone",
      "Serviço", "Check-in", "Check-out", "Status", "Vacinação", "Notas", "Valor"
    ]],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 20 },
      9: { cellWidth: 18 },
      10: { cellWidth: 40 },
      11: { cellWidth: 14 },
    },
    didParseCell: (data) => {
      const val = data.cell.raw;
      if (data.column.index === 8) {
        if (val === "No Hotel") data.cell.styles.textColor = [22, 163, 74];
        else if (val === "Confirmado") data.cell.styles.textColor = [37, 99, 235];
        else if (val === "Pendente") data.cell.styles.textColor = [234, 88, 12];
      }
    }
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
          <Sheet className="w-4 h-4 text-green-600" />
          Exportar Excel (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}