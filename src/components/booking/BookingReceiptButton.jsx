import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BookingReceiptButton({ booking }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("generateBookingReceipt", {
        booking_id: booking.id,
        booking_type: booking.type,
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${booking.id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recibo descarregado");
    } catch (err) {
      toast.error("Erro ao gerar recibo: " + (err?.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-9 h-9 rounded-2xl bg-slate-800 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
      title="Recibo PDF"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
    </button>
  );
}