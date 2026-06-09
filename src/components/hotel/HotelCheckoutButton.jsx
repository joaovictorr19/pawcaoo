import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Botão de checkout Stripe para reservas de hotel.
 * Recebe os dados da reserva e redireciona para o Stripe Checkout.
 */
export default function HotelCheckoutButton({ bookingData, className = "", size = "default", children }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!bookingData?.total_amount || bookingData.total_amount <= 0) {
      toast.error("Valor inválido para pagamento.");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("createHotelCheckout", bookingData);
      const { url, error } = response.data;

      if (error) {
        toast.error(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      size={size}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      {loading ? "A processar..." : (children || "Pagar com Cartão")}
    </Button>
  );
}