import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Home, Loader2, Building2, Scissors, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import ServiceQRCodes from "@/components/booking/ServiceQRCodes";
import { GADS_SEND_TO, trackConversionOnce } from "@/lib/googleAds";

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
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('event_id');
  const type = searchParams.get('type'); // 'booking' | 'hotel_booking' | 'group_walk'
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Confirm group walk booking
  const confirmGroupWalkMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("confirmGroupWalkBooking", {
        session_id: sessionId,
        event_id: eventId,
      });
      return response?.data;
    },
    onSuccess: (data) => {
      // Google Ads — PURCHASE (inscrição paga em passeio de grupo)
      trackConversionOnce(`gads_purchase_${sessionId}`, GADS_SEND_TO.purchase, {
        currency: 'EUR',
        transaction_id: sessionId,
      });
      setSessionDetails({
        isGroupWalk: true,
        id: sessionId,
        amount_total: 0,
        currency: 'eur',
        payment_status: 'paid',
        eventId: eventId,
        alreadyJoined: data?.already_joined,
      });
      queryClient.invalidateQueries(['groupWalkEventsPublic']);
      setLoading(false);
    },
    onError: (error) => {
      console.error('Group walk confirm error:', error);
      setSessionDetails({
        isGroupWalk: true,
        id: sessionId,
        amount_total: 0,
        currency: 'eur',
        payment_status: 'error',
        error: error?.message,
      });
      setLoading(false);
    }
  });

  // Update payment status
  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) return;

      // --- Hotel booking ---
      // Only mark payment as paid — the Stripe webhook already handles wallet crediting,
      // platform revenue, notifications, and emails. Crucially, the booking status stays
      // as 'pending' so the hotel can accept or reject the reservation.
      if (type === 'hotel_booking') {
        const records = await base44.entities.HotelBooking.filter({ id: bookingId });
        const booking = records[0];
        if (!booking) return;

        // Only update payment_status (fallback if webhook hasn't fired yet).
        // Do NOT change status — hotel must accept/reject manually.
        if (booking.payment_status !== 'paid') {
          await base44.entities.HotelBooking.update(bookingId, {
            payment_status: 'paid',
          });
        }

        return {
          id: bookingId,
          amount_total: (booking.total_amount || 0) * 100,
          currency: 'eur',
          payment_status: 'paid',
          isHotel: true,
          hotelName: booking.hotel_name,
          serviceType: booking.service_type,
          checkinDate: booking.checkin_date,
          ownerName: booking.owner_name,
        };
      }

      // --- Regular booking ---
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      const booking = bookings[0];
      if (!booking) return;

      await base44.entities.Booking.update(bookingId, { status: 'confirmed' });

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
      });

      return booking;
    },
    onSuccess: (data) => {
      if (data) {
        // Google Ads — PURCHASE (reserva paga)
        trackConversionOnce(`gads_purchase_${bookingId}`, GADS_SEND_TO.purchase, {
          value: data.isHotel ? (data.amount_total || 0) / 100 : (data.total_amount || 0),
          currency: 'EUR',
          transaction_id: bookingId,
        });
        if (data.isHotel) {
          setSessionDetails(data);
        } else {
          setSessionDetails({
            id: bookingId,
            amount_total: data.total_amount * 100,
            currency: 'eur',
            customer_email: data.owner_email,
            payment_status: 'paid',
            dog_name: data.dog_name,
            walk_date: data.walk_date,
            bookingData: data
          });
        }
      }
      queryClient.invalidateQueries(['myWalks']);
      queryClient.invalidateQueries(['hotelBookings']);
      setLoading(false);
    }
  });

  useEffect(() => {
    if (type === 'group_walk' && sessionId && eventId) {
      confirmGroupWalkMutation.mutate();
    } else if (bookingId) {
      updatePaymentMutation.mutate();
    } else {
      setLoading(false);
    }
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, [bookingId, type, sessionId, eventId]);



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

  if (!bookingId && !sessionDetails) {
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
              Pagamento Confirmado! 🎉
            </h1>
            <p className="text-center text-gray-600 text-lg mb-8">
              {sessionDetails?.isHotel
                ? `Reserva em ${sessionDetails.hotelName} confirmada com sucesso!`
                : sessionDetails?.isGroupWalk
                ? sessionDetails.alreadyJoined
                  ? 'Já estavas inscrito neste passeio em grupo!'
                  : 'A tua inscrição no passeio em grupo foi confirmada com sucesso! 🐕'
                : `O pagamento para o passeio de ${sessionDetails?.dog_name} foi processado com sucesso.`}
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

            {/* Next Steps — diferenciado por tipo de serviço */}
            {sessionDetails?.isHotel ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Como funciona a reserva no hotel?
                </h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside mb-3">
                  <li>O <strong>hotel recebe a reserva</strong> e vai <strong>aceitar ou recusar</strong> em breve.</li>
                  <li>Receberá uma notificação assim que o hotel confirmar a disponibilidade.</li>
                  <li>No dia combinado, dirija-se ao hotel para o check-in do seu animal.</li>
                </ol>
                {sessionDetails?.serviceType === 'grooming' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
                    <p className="text-sm font-semibold text-purple-800 flex items-center gap-1.5 mb-1.5">
                      <Scissors className="w-4 h-4" /> Banho & Tosquias — análise de preço
                    </p>
                    <p className="text-xs text-purple-700 leading-relaxed mb-2">
                      O valor pago agora é <strong>provisório</strong>. O hotel analisa o perfil e fotos do seu animal (pelagem, tamanho, raça) e pode propor um ajuste de preço. Se o fizer, recebe uma notificação e decide se <strong>aceita</strong> ou <strong>recusa</strong> a proposta.
                    </p>
                    <Link to="/PriceProposals" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 underline">
                      <CalendarCheck className="w-3.5 h-3.5" /> Ver propostas de preço
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">📱 Como funciona o serviço?</h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>O profissional chega e escaneia o <strong>QR de Início</strong></li>
                  <li>O serviço decorre normalmente</li>
                  <li>No fim, mostre o <strong>QR de Fim</strong> ao profissional</li>
                  <li>Após scan, o pagamento é automaticamente liberado</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}