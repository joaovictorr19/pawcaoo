import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Home, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

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
  const sessionId = searchParams.get('session_id');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Fetch session details from backend
   * In production, this would retrieve actual payment information
   */
  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual backend call
      // Mock session details
      setTimeout(() => {
        setSessionDetails({
          id: sessionId,
          amount_total: 5000, // €50.00 in cents
          currency: 'eur',
          customer_email: 'customer@example.com',
          payment_status: 'paid',
          application_fee_amount: 750, // 15% of €50
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching session:", error);
      setLoading(false);
    }
  };

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

  if (!sessionId || !sessionDetails) {
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
              Payment Successful!
            </h1>
            <p className="text-center text-gray-600 text-lg mb-8">
              Thank you for your purchase. Your payment has been processed successfully.
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

            {/* Next Steps */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Confirmation email sent to {sessionDetails.customer_email}</li>
                <li>✓ Professional has been notified of your purchase</li>
                <li>✓ You'll receive service details shortly</li>
                <li>✓ Receipt available in your account dashboard</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={() => navigate(createPageUrl('MyBookings'))}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
              >
                <Package className="w-4 h-4 mr-2" />
                View My Bookings
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Implementation Note */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Demo Mode:</strong> In production, this page would show real payment details
                and trigger order fulfillment workflows via webhooks.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}