
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CheckoutModal({ 
  booking, 
  onClose, 
  onSuccess 
}) {
  const { language } = useLanguage();
  const { user, paymentMethods = [] } = booking;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Validate payment method
      if (!selectedPaymentMethod) {
        throw new Error(language === 'pt' ? "Selecione um método de pagamento" : "Select a payment method");
      }

      // In production, this would integrate with Stripe
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create payment record
      const payment = await base44.entities.Payment.create({
        booking_id: booking.id,
        payer_email: user.email,
        payer_name: user.full_name,
        recipient_email: booking.walker_email,
        recipient_name: booking.walker_name,
        service_amount: booking.service_amount,
        platform_fee: booking.platform_fee,
        transaction_fee: 1, // €1 fixed
        insurance_fee: booking.insurance_selected ? 2 : 0,
        extra_services_fee: booking.extra_services_total || 0,
        total_amount: booking.total_amount,
        platform_fee_percentage: 15,
        status: "held", // Hold payment until service completion
        payment_method: selectedPaymentMethod.type,
        held_date: new Date().toISOString()
      });

      // Update booking with payment info
      await base44.entities.Booking.update(booking.id, {
        payment_status: "held",
        payment_id: payment.id,
        status: "confirmed"
      });

      toast.success(language === 'pt' ? "Pagamento processado com sucesso!" : "Payment processed successfully!");
      
      if (onSuccess) {
        onSuccess(payment);
      }
      
      onClose();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || (language === 'pt' ? "Erro ao processar pagamento" : "Payment processing failed"));
      toast.error(err.message || (language === 'pt' ? "Erro ao processar pagamento" : "Payment processing failed"));
    } finally {
      setProcessing(false);
    }
  };

  const getCardBrand = (type) => {
    const brands = {
      credit_card: "💳 Cartão",
      debit_card: "💳 Débito",
      mbway: "📱 MB WAY",
      paypal: "💙 PayPal"
    };
    return brands[type] || "💳";
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
            <CreditCard className="w-6 h-6 text-blue-600" />
            {language === 'pt' ? 'Confirmar Pagamento' : 'Confirm Payment'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'pt' ? 'Resumo da Reserva' : 'Booking Summary'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Serviço' : 'Service'}:</span>
                <span className="font-medium">€{booking.service_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Taxa de Plataforma' : 'Platform Fee'}:</span>
                <span className="font-medium">€{booking.platform_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Taxa de Transação' : 'Transaction Fee'}:</span>
                <span className="font-medium">€1.00</span>
              </div>
              {booking.insurance_selected && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'pt' ? 'Seguro' : 'Insurance'}:</span>
                  <span className="font-medium">€2.00</span>
                </div>
              )}
              {booking.extra_services_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'pt' ? 'Serviços Extras' : 'Extra Services'}:</span>
                  <span className="font-medium">€{booking.extra_services_total?.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'pt' ? 'Selecionar Método de Pagamento' : 'Select Payment Method'}
            </h3>
            <div className="space-y-2">
              {paymentMethods.map((method, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === method
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-sm">
                            {getCardBrand(method.type)}
                          </div>
                          <div className="text-xs text-gray-600">
                            •••• {method.last_four}
                          </div>
                        </div>
                      </div>
                      {selectedPaymentMethod === method && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    {method.is_default && (
                      <Badge className="mt-2 bg-green-500 text-white text-xs">
                        {language === 'pt' ? 'Padrão' : 'Default'}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-orange-800">
                    {language === 'pt' 
                      ? 'Adicione um método de pagamento primeiro'
                      : 'Add a payment method first'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-800">
                {language === 'pt'
                  ? '💰 Pagamento será mantido em caução até a conclusão do serviço. Processamento seguro via Stripe.'
                  : '💰 Payment will be held in escrow until service completion. Secure processing via Stripe.'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
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
              onClick={handlePayment}
              disabled={processing || !selectedPaymentMethod}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 h-14 text-lg font-bold"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {language === 'pt' ? 'A processar...' : 'Processing...'}
                </>
              ) : (
                <>
                  {language === 'pt' ? 'Pagar' : 'Pay'} €{booking.total_amount?.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
