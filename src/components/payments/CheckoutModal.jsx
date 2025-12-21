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
import { useTheme } from "@/components/ThemeContext";
import VoucherApplicator from "@/components/loyalty/VoucherApplicator";
import { useQuery } from "@tanstack/react-query";

export default function CheckoutModal({ 
  booking, 
  onClose, 
  onSuccess 
}) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = booking;
  const [processing, setProcessing] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || null;
    },
    enabled: !!user?.email,
  });

  const finalAmount = appliedVoucher 
    ? Math.max(0, booking.total_amount - appliedVoucher.euro_value)
    : booking.total_amount;

  const pointsToEarn = loyaltyPoints
    ? Math.floor(finalAmount * 10 * (loyaltyPoints.tier === 'silver' ? 1.2 : loyaltyPoints.tier === 'gold' ? 1.5 : loyaltyPoints.tier === 'platinum' ? 2 : 1))
    : Math.floor(finalAmount * 10);

  const handleStripeCheckout = async () => {
    setProcessing(true);
    console.log('🔵 Iniciando checkout Stripe...');

    try {
      // Se houver voucher aplicado, marcar como usado
      if (appliedVoucher) {
        await base44.entities.Redemption.update(appliedVoucher.id, {
          status: 'pending'
        });
      }

      console.log('📦 Payload:', {
        bookingId: booking.id,
        voucherCode: appliedVoucher?.redemption_code,
        discountAmount: appliedVoucher?.euro_value || 0,
      });

      const response = await base44.functions.invoke('createStripeCheckout', {
        bookingId: booking.id,
        voucherCode: appliedVoucher?.redemption_code,
        discountAmount: appliedVoucher?.euro_value || 0,
        successUrl: `${window.location.origin}${createPageUrl('CheckoutSuccess')}?booking_id=${booking.id}`,
        cancelUrl: `${window.location.origin}${createPageUrl('MyBookings')}`,
      });

      console.log('✅ Resposta do backend:', response);
      console.log('📊 Response structure:', {
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        fullResponse: response
      });

      const checkoutUrl = response?.data?.url;

      if (checkoutUrl) {
        console.log('🔗 Redirecionando para Stripe:', checkoutUrl);
        
        // Add timeout warning
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Redirect está demorando mais de 3 segundos...');
          toast.error('Redirecionamento lento. Se não funcionar, tente novamente.');
          setProcessing(false);
        }, 3000);

        // Redirect
        window.location.href = checkoutUrl;
        
        // Clear timeout if redirect happens
        clearTimeout(timeoutId);
      } else {
        console.error('❌ URL do Stripe não encontrada!');
        console.error('Response completa:', JSON.stringify(response, null, 2));
        toast.error('Erro: Link de pagamento não foi gerado. Verifique o console.');
        setProcessing(false);
      }
    } catch (err) {
      console.error("❌ Erro no checkout:", err);
      console.error("Tipo de erro:", err.name);
      console.error("Mensagem:", err.message);
      toast.error(language === 'pt' ? `Erro: ${err.message}` : `Error: ${err.message}`);
      setProcessing(false);
    }
  };

  // CRITICAL: Cleanup on unmount to prevent frozen modals
  React.useEffect(() => {
    return () => {
      setProcessing(false);
    };
  }, []);

  // Escape key handler
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !processing) {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [processing, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      style={{ zIndex: 60 }}
      onClick={(e) => {
        if (!processing && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 relative"
        style={{ zIndex: 61 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-green-600" />
            {language === 'pt' ? 'Pagamento via MBWay' : 'Payment via MBWay'}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Booking Summary - TRANSPARÊNCIA */}
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serviço do Profissional:</span>
                <span className="font-medium">€{(booking.service_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa da Plataforma:</span>
                <span>€{(booking.platform_fee || 0).toFixed(2)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto PawPoints:</span>
                  <span>-€{appliedVoucher.euro_value.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-green-600">€{finalAmount.toFixed(2)}</span>
              </div>
              {appliedVoucher && booking.total_amount !== finalAmount && (
                <p className="text-xs text-gray-500 line-through">€{booking.total_amount.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Voucher Section */}
          <VoucherApplicator 
            userEmail={user?.email} 
            onVoucherApplied={setAppliedVoucher}
          />

          {/* Points Preview */}
          {pointsToEarn > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <p className="text-sm text-center text-purple-800">
                <span className="font-bold text-lg">+{pointsToEarn}</span> PawPoints após conclusão
              </p>
            </div>
          )}

          {/* Payment Instructions + Refund Policy */}
          <div className="space-y-3">
            <div className="bg-green-50 border-2 border-green-100 rounded-xl p-5">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <Check className="w-5 h-5" />
                {language === 'pt' ? 'Pagamento Seguro' : 'Secure Payment'}
              </h4>
              <p className="text-sm text-green-700 mb-3 leading-relaxed">
                {language === 'pt' 
                  ? 'Pagamento processado de forma segura pelo Stripe. O valor ficará retido até a conclusão do serviço.'
                  : 'Payment securely processed by Stripe. Amount will be held until service completion.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-white/50 p-2 rounded-lg">
                <Check className="w-4 h-4" />
                {language === 'pt' ? '🔒 Pagamento protegido' : '🔒 Protected payment'}
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-800 mb-2">💙 Política de Cancelamento</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p>✅ <strong>Status Pendente:</strong> 100% reembolso</p>
                <p>✅ <strong>Confirmado (Premium):</strong> 100% reembolso</p>
                <p>⚠️ <strong>Confirmado (Free):</strong> 80% reembolso</p>
              </div>
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
              onClick={handleStripeCheckout}
              disabled={processing}
              className="flex-1 h-12 font-bold text-white hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              style={{
                background: processing 
                  ? `linear-gradient(to right, ${colors?.primary || '#3b82f6'}cc, ${colors?.primary || '#3b82f6'}99)` 
                  : `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`,
                opacity: processing ? 0.8 : 1,
                pointerEvents: processing ? 'none' : 'auto'
              }}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {language === 'pt' ? 'Abrindo Stripe...' : 'Opening Stripe...'}
                </span>
              ) : (
                <>
                  {language === 'pt' ? 'Pagar Agora' : 'Pay Now'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}