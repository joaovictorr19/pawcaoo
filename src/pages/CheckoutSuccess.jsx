import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Home, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import ServiceQRCodes from "@/components/booking/ServiceQRCodes";

/**
 * Checkout Success Page
 * 
 * Displayed after successful Stripe Checkout completion
 * 
 * BACKEND IMPLEMENTATION:
 * You should retrieve the checkout session to verify payment and get details:
 * 
 * const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');
 * 
 * const session = await stripe.checkout.sessions.retrieve(
 *   sessionId,
 *   {
 *     expand: ['line_items', 'payment_intent']
 *   },
 *   {
 *     stripeAccount: connectedAccountId
 *   }
 * );
 * 
 * Use this information to:
 * 1. Create order records in your database
 * 2. Send confirmation emails
 * 3. Trigger fulfillment workflows
 * 4. Update loyalty points
 * 5. Send notifications to the professional
 */

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bookingId = searchParams.get('booking_id');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Update payment status
  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) return;
      
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      const booking = bookings[0];
      
      if (!booking) return;
      
      await base44.entities.Booking.update(bookingId, {
        status: 'confirmed'
      });
      
      const payments = await base44.entities.Payment.filter({ booking_id: bookingId });
      if (payments.length > 0) {
        await base44.entities.Payment.update(payments[0].id, {
          status: 'held',
          held_date: new Date().toISOString()
        });
      }
      
      await base44.entities.Notification.create({
        recipient_email: booking.walker_email,
        title: '💰 Novo Passeio Confirmado!',
        message: `Pagamento recebido para ${booking.dog_name} em ${booking.walk_date}. Passeio confirmado!`,
        type: 'booking',
        related_id: bookingId,
        priority: 'high'
      });

      return booking;
    },
    onSuccess: (booking) => {
      if (booking) {
        setSessionDetails({
          id: bookingId,
          amount_total: booking.total_amount * 100,
          currency: 'eur',
          customer_email: booking.owner_email,
          payment_status: 'paid',
          dog_name: booking.dog_name,
          walk_date: booking.walk_date,
          bookingData: booking
        });
      }
      queryClient.invalidateQueries(['myWalks']);
      setLoading(false);
    }
  });

  useEffect(() => {
    if (bookingId) {
      updatePaymentMutation.mutate();
    } else {
      setLoading(false);
    }
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [bookingId]);



  const formatPrice = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });
    return formatter.format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (!bookingId || !sessionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Session Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find your checkout session. Please contact support if you completed a payment.
            </p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-2xl border-0 shadow-2xl">
          <CardContent className="p-12">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Pagamento Confirmado!
            </h1>
            <p className="text-center text-gray-600 text-lg mb-8">
              O pagamento para o passeio de {sessionDetails?.dog_name} foi processado com sucesso.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-mono text-sm text-gray-900">{sessionDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(sessionDetails.amount_total, sessionDetails.currency)}
                  </span>
                </div>
                {sessionDetails.application_fee_amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="text-orange-600">
                      {formatPrice(sessionDetails.application_fee_amount, sessionDetails.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600 capitalize">
                    {sessionDetails.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Codes */}
            {sessionDetails?.bookingData && (
              <div className="mb-8">
                <ServiceQRCodes booking={sessionDetails.bookingData} />
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">📱 Como funciona o serviço?</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>O profissional chega e escaneia o <strong>QR de Início</strong></li>
                <li>O serviço decorre normalmente</li>
                <li>No fim, mostre o <strong>QR de Fim</strong> ao profissional</li>
                <li>Após scan, o pagamento é automaticamente liberado</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}