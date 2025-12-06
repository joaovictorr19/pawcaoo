import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Check, ArrowRight, Smartphone } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CheckoutModal({ 
  booking, 
  onClose, 
  onSuccess 
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = booking;
  const [processing, setProcessing] = useState(false);

  const handleConfirmAndChat = async () => {
    setProcessing(true);

    try {
      // Just update booking status to pending (already is, but confirming intent)
      // In this manual flow, 'pending' means "requested, discussing payment/details"
      // We don't create a Payment record yet as it's off-platform
      
      // Optionally we could create a "manual" payment record as pending
      /*
      await base44.entities.Payment.create({
        booking_id: booking.id,
        payer_email: user.email,
        recipient_email: booking.walker_email,
        total_amount: booking.total_amount,
        status: "pending",
        payment_method: "mbway_manual"
      });
      */

      toast.success(language === 'pt' ? "Solicitação enviada! Combine o pagamento no chat." : "Request sent! Arrange payment in chat.");
      
      if (onSuccess) {
        onSuccess(null); // No payment object
      }
      
      // Navigate to messages with this walker
      const walkerId = booking.walker_id || booking.professional_id;
      navigate(createPageUrl(`Messages?walker_id=${walkerId}`));
      
      onClose();
    } catch (err) {
      console.error("Error:", err);
      toast.error(language === 'pt' ? "Erro ao processar" : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-green-600" />
            {language === 'pt' ? 'Pagamento via MBWay' : 'Payment via MBWay'}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'pt' ? 'Resumo da Reserva' : 'Booking Summary'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Serviço para' : 'Service for'}:</span>
                <span className="font-medium">{booking.dog_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Data' : 'Date'}:</span>
                <span className="font-medium">{booking.walk_date} ({booking.walk_time})</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-5">
            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {language === 'pt' ? 'Como Pagar' : 'How to Pay'}
            </h4>
            <p className="text-sm text-blue-700 mb-3 leading-relaxed">
              {language === 'pt' 
                ? 'No momento, os pagamentos são combinados diretamente com o passeador. Clique abaixo para abrir o chat e solicitar o número MBWay.'
                : 'Currently, payments are arranged directly with the walker. Click below to open the chat and request their MBWay number.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-white/50 p-2 rounded-lg">
              <Check className="w-4 h-4" />
              {language === 'pt' ? 'Sua reserva ficará pendente até confirmação.' : 'Your booking will be pending confirmation.'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmAndChat}
              disabled={processing}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-12 font-bold text-white"
            >
              {language === 'pt' ? 'Combinar no Chat' : 'Arrange in Chat'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}