import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, Package, DollarSign, Loader2, 
  AlertCircle, CheckCircle2, Store 
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/**
 * Connected Account Storefront
 * 
 * This page displays products for a specific connected account
 * and allows customers to purchase them using Stripe Checkout
 * 
 * URL Pattern: /storefront/:accountId
 * 
 * IMPORTANT NOTES:
 * - In production, use a more user-friendly identifier (username, slug, etc.)
 *   instead of the Stripe account ID in the URL
 * - All product data should be fetched from Stripe API with Stripe-Account header
 * - Checkout sessions must be created with application_fee_amount for monetization
 */

export default function ConnectedAccountStorefront() {
  const { accountId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  /**
   * Fetch products from connected account
   * 
   * BACKEND IMPLEMENTATION:
   * 
   * const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');
   * 
   * const products = await stripe.products.list({
   *   active: true,
   *   expand: ['data.default_price'], // Include price data
   * }, {
   *   stripeAccount: accountId, // This sets the Stripe-Account header
   * });
   * 
   * return products.data;
   */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual backend call
      // Mock data for demonstration
      const mockProducts = [
        {
          id: `prod_${Date.now()}_1`,
          name: "Basic Dog Training Session",
          description: "One-on-one training session focused on basic commands",
          default_price: {
            id: `price_${Date.now()}_1`,
            unit_amount: 5000, // €50.00 in cents
            currency: "eur"
          },
          images: ["https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400"]
        },
        {
          id: `prod_${Date.now()}_2`,
          name: "Premium Training Package",
          description: "5 comprehensive training sessions with personalized plan",
          default_price: {
            id: `price_${Date.now()}_2`,
            unit_amount: 20000, // €200.00 in cents
            currency: "eur"
          },
          images: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"]
        },
        {
          id: `prod_${Date.now()}_3`,
          name: "Behavioral Assessment",
          description: "Complete behavioral assessment and consultation",
          default_price: {
            id: `price_${Date.now()}_3`,
            unit_amount: 7500, // €75.00 in cents
            currency: "eur"
          },
          images: ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"]
        }
      ];

      // Mock account info
      setAccountInfo({
        business_name: "PawCão Professional Services",
        email: "professional@pawcao.com"
      });

      setProducts(mockProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accountId) {
      fetchProducts();
    }
  }, [accountId]);

  /**
   * Create Checkout Session with Direct Charge
   * 
   * BACKEND IMPLEMENTATION:
   * 
   * const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');
   * 
   * const session = await stripe.checkout.sessions.create({
   *   line_items: [{
   *     price: priceId,
   *     quantity: quantity,
   *   }],
   *   mode: 'payment',
   *   payment_intent_data: {
   *     // Application fee is your platform's commission
   *     // Example: 15% of €50 = €7.50 = 750 cents
   *     application_fee_amount: Math.round(unitAmount * 0.15),
   *   },
   *   success_url: `${YOUR_DOMAIN}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
   *   cancel_url: `${YOUR_DOMAIN}/storefront/${accountId}`,
   * }, {
   *   stripeAccount: accountId, // Process payment on connected account
   * });
   * 
   * return session.url;
   * 
   * IMPORTANT NOTES:
   * - application_fee_amount is how you monetize as a platform
   * - The fee is deducted before funds reach the connected account
   * - Connected account pays Stripe processing fees (because of controller.fees.payer: 'account')
   * - You should calculate the fee based on your business model (flat fee, percentage, tiered, etc.)
   */
  const handlePurchase = async (product) => {
    setProcessingCheckout(true);
    try {
      const price = product.default_price;
      const unitAmount = price.unit_amount;
      
      /**
       * Calculate application fee (platform commission)
       * This example uses 15% commission
       * Adjust based on your pricing model
       */
      const applicationFeeAmount = Math.round(unitAmount * 0.15);
      
      console.log('Creating checkout session:', {
        product: product.name,
        amount: unitAmount,
        applicationFee: applicationFeeAmount,
        connectedAccount: accountId
      });

      // TODO: Replace with actual backend call
      toast.info("In production, this would redirect to Stripe Checkout");
      
      // Mock successful purchase
      setTimeout(() => {
        toast.success("Purchase successful! (Demo mode)");
        setProcessingCheckout(false);
      }, 2000);
      
      /**
       * In production, redirect to the checkout URL:
       * window.location.href = checkoutSession.url;
       */
      
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to initiate checkout");
      setProcessingCheckout(false);
    }
  };

  /**
   * Format price for display
   */
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
          <p className="text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {accountInfo?.business_name || "Professional Services"}
              </h1>
              <p className="text-gray-600">
                Powered by PawCão • Secure payments via Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Demo Storefront:</strong> This is a demonstration of Stripe Connect's direct charge flow.
            In production, this would process real payments with automatic platform fees.
          </AlertDescription>
        </Alert>

        {/* Account ID Notice (Remove in production) */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Production Note:</strong> Currently using Stripe Account ID ({accountId}) in URL.
            Replace with a user-friendly identifier like username or custom slug for better UX.
          </AlertDescription>
        </Alert>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Available</h2>
              <p className="text-gray-600">
                This professional hasn't added any products yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow overflow-hidden h-full flex flex-col">
                  {/* Product Image */}
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
                        <Package className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1">
                      {product.description || "No description available"}
                    </p>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-green-600">
                        {formatPrice(
                          product.default_price.unit_amount,
                          product.default_price.currency
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        +15% platform fee
                      </Badge>
                    </div>

                    {/* Purchase Button */}
                    <Button
                      onClick={() => handlePurchase(product)}
                      disabled={processingCheckout}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                    >
                      {processingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase Now
                        </>
                      )}
                    </Button>

                    {/* Fee Breakdown */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Payment Breakdown:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Price:</span>
                          <span className="font-semibold">
                            {formatPrice(
                              product.default_price.unit_amount,
                              product.default_price.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee (15%):</span>
                          <span className="font-semibold text-orange-600">
                            {formatPrice(
                              Math.round(product.default_price.unit_amount * 0.15),
                              product.default_price.currency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span className="text-gray-600">Professional Receives:</span>
                          <span className="font-semibold text-green-600">
                            {formatPrice(
                              Math.round(product.default_price.unit_amount * 0.85),
                              product.default_price.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Implementation Notes */}
        <Card className="border-2 border-blue-200 bg-blue-50 mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Direct Charge Implementation Notes
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Products are created and listed on the connected account using Stripe-Account header</li>
              <li>• Checkout sessions use payment_intent_data.application_fee_amount for platform commission</li>
              <li>• Connected account receives funds minus your platform fee</li>
              <li>• Stripe processing fees are paid by the connected account (controller.fees.payer: 'account')</li>
              <li>• You can customize the application fee based on subscription tier, service type, etc.</li>
              <li>• Consider adding webhooks to handle payment.succeeded events for order fulfillment</li>
            </ul>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Secure payments powered by Stripe</span>
          </div>
          <p>Account ID: {accountId}</p>
        </div>
      </div>
    </div>
  );
}