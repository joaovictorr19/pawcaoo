import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, CheckCircle2, AlertCircle, Loader2, 
  DollarSign, Package, ExternalLink, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

/**
 * Stripe Connect Setup Page
 * 
 * This page allows professionals (walkers/trainers) to:
 * 1. Create a Stripe Connected Account
 * 2. Complete onboarding via Account Links
 * 3. View their account status
 * 4. Create products to sell
 * 
 * IMPORTANT SETUP NOTES:
 * - Replace 'YOUR_STRIPE_SECRET_KEY' with your actual Stripe secret key in the integration
 * - Use test mode keys (sk_test_...) for development
 * - Use live mode keys (sk_live_...) for production
 * - Never expose secret keys in frontend code - all Stripe API calls should go through backend
 */

export default function StripeConnectSetup() {
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  
  // Product form state
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "eur"
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  /**
   * Get or retrieve the Stripe Account ID
   * In production, you should store this in your User entity
   * For this demo, we're using localStorage
   */
  const getStripeAccountId = () => {
    return localStorage.getItem(`stripe_account_${user?.email}`);
  };

  const setStripeAccountId = (accountId) => {
    localStorage.setItem(`stripe_account_${user?.email}`, accountId);
  };

  /**
   * Fetch account status from Stripe API
   */
  const fetchAccountStatus = async () => {
    const accountId = getStripeAccountId();
    if (!accountId) {
      setAccountStatus(null);
      return;
    }

    setRefreshing(true);
    try {
      const response = await base44.functions.retrieveStripeAccount({
        accountId: accountId
      });

      if (response.success) {
        setAccountStatus(response.account);
      } else {
        toast.error(response.error || "Failed to fetch account status");
      }
    } catch (error) {
      console.error("Error fetching account status:", error);
      toast.error("Failed to fetch account status");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      // Load account ID from user profile if exists
      if (user.stripe_account_id) {
        setStripeAccountId(user.stripe_account_id);
      }
      fetchAccountStatus();
    }
  }, [user]);

  // Handle return from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Onboarding completed successfully!");
      fetchAccountStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('refresh') === 'true') {
      toast.info("Please complete the onboarding process");
      const accountId = getStripeAccountId();
      if (accountId) {
        startOnboarding(accountId);
      }
    }
  }, []);

  /**
   * Step 1: Create a Connected Account
   */
  const createConnectedAccount = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.createStripeConnectedAccount({
        email: user.email,
        country: 'PT'
      });

      if (response.success) {
        setStripeAccountId(response.accountId);
        
        // Update user profile with Stripe account ID
        await base44.auth.updateMe({
          stripe_account_id: response.accountId
        });
        
        toast.success("Connected account created! Now complete onboarding.");
        
        // Immediately start onboarding
        await startOnboarding(response.accountId);
      } else {
        toast.error(response.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Failed to create connected account");
    }
    setLoading(false);
  };

  /**
   * Step 2: Create Account Link for Onboarding
   */
  const startOnboarding = async (accountId = null) => {
    const id = accountId || getStripeAccountId();
    if (!id) {
      toast.error("No connected account found");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await base44.functions.createStripeAccountLink({
        accountId: id,
        refreshUrl: `${baseUrl}/stripe-connect-setup?refresh=true`,
        returnUrl: `${baseUrl}/stripe-connect-setup?success=true`
      });

      if (response.success) {
        // Redirect to Stripe onboarding
        window.location.href = response.url;
      } else {
        toast.error(response.error || "Failed to create onboarding link");
      }
    } catch (error) {
      console.error("Error creating account link:", error);
      toast.error("Failed to start onboarding");
    }
    setLoading(false);
  };

  /**
   * Step 3: Create a Product on Connected Account
   */
  const createProduct = async (e) => {
    e.preventDefault();
    
    const accountId = getStripeAccountId();
    if (!accountId) {
      toast.error("Please complete onboarding first");
      return;
    }

    if (!accountStatus?.charges_enabled) {
      toast.error("Your account must complete onboarding before creating products");
      return;
    }

    setLoading(true);
    try {
      const priceInCents = Math.round(parseFloat(productData.price) * 100);
      
      const response = await base44.functions.createStripeProduct({
        accountId: accountId,
        name: productData.name,
        description: productData.description,
        price: priceInCents,
        currency: productData.currency
      });

      if (response.success) {
        toast.success(`Product "${productData.name}" created!`);
        
        // Reset form
        setProductData({
          name: "",
          description: "",
          price: "",
          currency: "eur"
        });
        setShowProductForm(false);
      } else {
        toast.error(response.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    }
    setLoading(false);
  };

  /**
   * Get status badge based on account state
   */
  const getStatusBadge = () => {
    if (!accountStatus) {
      return <Badge variant="outline">Not Connected</Badge>;
    }

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }

    if (accountStatus.details_submitted) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Pending Verification
        </Badge>
      );
    }

    return (
      <Badge className="bg-orange-500 text-white">
        <AlertCircle className="w-3 h-3 mr-1" />
        Onboarding Incomplete
      </Badge>
    );
  };

  const storefrontUrl = accountStatus?.id 
    ? `${window.location.origin}/storefront/${accountStatus.id}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="w-10 h-10 text-blue-600" />
            Stripe Connect Setup
          </h1>
          <p className="text-gray-600">
            Set up your payment account to receive earnings directly
          </p>
        </div>



        {/* Account Status Card */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Account Status</CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!accountStatus ? (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Connected Account
                </h3>
                <p className="text-gray-600 mb-4">
                  Create a Stripe connected account to start receiving payments
                </p>
                <Button
                  onClick={createConnectedAccount}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Create Connected Account
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Account ID */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm text-gray-600">Account ID</Label>
                  <p className="font-mono text-sm text-gray-900 mt-1">
                    {accountStatus.id}
                  </p>
                </div>

                {/* Status Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm text-gray-600">Charges</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {accountStatus.charges_enabled ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-semibold">Enabled</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-500 font-semibold">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm text-gray-600">Payouts</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {accountStatus.payouts_enabled ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-semibold">Enabled</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-500 font-semibold">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm text-gray-600">Details</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {accountStatus.details_submitted ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-semibold">Complete</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-500 font-semibold">Incomplete</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {accountStatus.requirements?.currently_due?.length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      <strong>Action Required:</strong> Complete the onboarding process to enable payments.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {!accountStatus.charges_enabled && (
                    <Button
                      onClick={() => startOnboarding()}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Complete Onboarding
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={fetchAccountStatus}
                    disabled={refreshing}
                    variant="outline"
                  >
                    {refreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Status
                      </>
                    )}
                  </Button>

                  {storefrontUrl && accountStatus.charges_enabled && (
                    <Button
                      onClick={() => window.open(storefrontUrl, '_blank')}
                      variant="outline"
                      className="ml-auto"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      View Storefront
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Management Card */}
        {accountStatus?.charges_enabled && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Product Management</CardTitle>
                <Button
                  onClick={() => setShowProductForm(!showProductForm)}
                  size="sm"
                  variant="secondary"
                >
                  {showProductForm ? "Cancel" : "Add Product"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {showProductForm ? (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={createProduct}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={productData.name}
                      onChange={(e) => setProductData({...productData, name: e.target.value})}
                      placeholder="Premium Dog Training Package"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="productDescription">Description</Label>
                    <Input
                      id="productDescription"
                      value={productData.description}
                      onChange={(e) => setProductData({...productData, description: e.target.value})}
                      placeholder="5-session package with personalized training plan"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productPrice">Price (€) *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={productData.price}
                        onChange={(e) => setProductData({...productData, price: e.target.value})}
                        placeholder="25.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="productCurrency">Currency</Label>
                      <select
                        id="productCurrency"
                        value={productData.currency}
                        onChange={(e) => setProductData({...productData, currency: e.target.value})}
                        className="w-full h-10 rounded-md border border-gray-300 px-3"
                      >
                        <option value="eur">EUR (€)</option>
                        <option value="usd">USD ($)</option>
                        <option value="gbp">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Create Product
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Create Your First Product
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add products or services that your customers can purchase
                  </p>
                  <Button
                    onClick={() => setShowProductForm(true)}
                    variant="outline"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}