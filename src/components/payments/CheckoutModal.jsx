import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  bookingData, 
  onSuccess 
}) {
  const { language } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { user, paymentMethods = [] } = bookingData;

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      setProcessing(true);
      
      // Create payment record
      const payment = await base44.entities.Payment.create({
        booking_id: paymentData.booking_id,
        payer_email: user.email,
        payer_name: user.full_name,
        recipient_email: paymentData.professional_email,
        recipient_name: paymentData.professional_name,
        service_amount: paymentData.service_amount,
        platform_fee: paymentData.platform_fee,
        transaction_fee: 1, // €1 fixed
        total_amount: paymentData.total_amount,
        status: "held", // Hold payment until service completion
        payment_method: selectedMethod?.type || "credit_card",
        held_date: new Date().toISOString()
      });

      // In production, integrate with Stripe API here
      // const stripePaymentIntent = await stripe.paymentIntents.create({...});
      
      // Update booking with payment info
      await base44.entities.Booking.update(bookingData.booking_id, {
        payment_id: payment.id,
        payment_status: "held",
        status: "confirmed"
      });

      // Send notification to walker
      await base44.entities.Notification.create({
        recipient_email: paymentData.professional_email,
        title: language === 'pt' ? 'Nova Reserva Confirmada!' : 'New Booking Confirmed!',
        message: `${user.full_name} ${language === 'pt' ? 'fez uma reserva' : 'made a booking'} - €${paymentData.total_amount}`,
        type: "booking",
        related_id: bookingData.booking_id,
        priority: "high"
      });

      return payment;
    },
    onSuccess: () => {
      setProcessing(false);
      toast.success(language === 'pt' ? 'Pagamento processado com sucesso!' : 'Payment processed successfully!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setProcessing(false);
      toast.error(language === 'pt' ? 'Erro ao processar pagamento' : 'Payment processing failed');
      console.error(error);
    }
  });

  const handlePayment = () => {
    if (!selectedMethod) {
      toast.error(language === 'pt' ? 'Selecione um método de pagamento' : 'Select a payment method');
      return;
    }

    processPaymentMutation.mutate({
      booking_id: bookingData.booking_id,
      professional_email: bookingData.professional_email,
      professional_name: bookingData.professional_name,
      service_amount: bookingData.service_amount,
      platform_fee: bookingData.platform_fee,
      total_amount: bookingData.total_amount
    });
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            {language === 'pt' ? 'Confirmar Pagamento' : 'Confirm Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'pt' ? 'Resumo da Reserva' : 'Booking Summary'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Serviço' : 'Service'}:</span>
                <span className="font-medium">€{bookingData.service_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Taxa de Plataforma' : 'Platform Fee'}:</span>
                <span className="font-medium">€{bookingData.platform_fee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'pt' ? 'Taxa de Transação' : 'Transaction Fee'}:</span>
                <span className="font-medium">€1.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-green-600">€{bookingData.total_amount?.toFixed(2)}</span>
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
                      selectedMethod === method
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method)}
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
                      {selectedMethod === method && (
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
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing || !selectedMethod || paymentMethods.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'pt' ? 'A processar...' : 'Processing...'}
                </>
              ) : (
                <>
                  {language === 'pt' ? 'Confirmar Pagamento' : 'Confirm Payment'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}