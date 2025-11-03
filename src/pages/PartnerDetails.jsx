import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Phone, Globe, ShoppingBag, Star, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PartnerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners, isLoading: loadingPartner } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partnership.list(),
    initialData: [],
  });

  const partner = partners.find(p => p.id === partnerId);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['partnerProducts', partnerId],
    queryFn: () => base44.entities.PartnerProduct.filter({ 
      partner_id: partnerId,
      is_available: true 
    }),
    enabled: !!partnerId,
    initialData: [],
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user?.email
      });
      return points[0];
    },
    enabled: !!user,
  });

  const redeemProductMutation = useMutation({
    mutationFn: async (product) => {
      // Check if user has enough points
      if (!loyaltyPoints || loyaltyPoints.points_balance < product.points_cost) {
        throw new Error("Insufficient points");
      }

      // Create redemption record
      const redemption = await base44.entities.Redemption.create({
        user_email: user?.email,
        user_name: user?.full_name,
        product_id: product.id,
        product_name: product.product_name,
        partner_id: partner.id,
        partner_name: partner.partner_name,
        points_spent: product.points_cost,
        euro_value: product.price_euro || 0,
        redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      });

      // Deduct points
      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: loyaltyPoints.points_balance - product.points_cost,
        total_redeemed: (loyaltyPoints.total_redeemed || 0) + product.points_cost
      });

      // Create points transaction
      await base44.entities.PointsTransaction.create({
        user_email: user?.email,
        transaction_type: "redeemed",
        points_amount: product.points_cost,
        description: `Redeemed: ${product.product_name}`,
        balance_after: loyaltyPoints.points_balance - product.points_cost
      });

      // Create notification
      await base44.entities.Notification.create({
        recipient_email: user?.email,
        title: "Points Redeemed!",
        message: `You've successfully redeemed ${product.points_cost} points for ${product.product_name}. Use code: ${redemption.redemption_code}`,
        type: "system",
        related_id: redemption.id
      });

      return redemption;
    },
    onSuccess: (redemption) => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['pointsTransactions'] });
      toast.success(`Product redeemed! Your code: ${redemption.redemption_code}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to redeem product");
    }
  });

  if (loadingPartner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-96 rounded-3xl mb-6" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Partner not found</h2>
          <Button onClick={() => navigate(createPageUrl('Partners'))}>
            Back to Partners
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          className="mb-6 border-green-200 hover:bg-green-50"
          onClick={() => navigate(createPageUrl('Partners'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Partners
        </Button>

        {/* Partner Header */}
        <Card className="border-0 shadow-2xl mb-8">
          <div className="relative h-64 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.partner_name}
                className="max-h-48 max-w-[80%] object-contain"
              />
            ) : (
              <h1 className="text-6xl font-bold text-gray-700">{partner.partner_name}</h1>
            )}
            {partner.discount_percentage > 0 && (
              <div className="absolute top-6 right-6">
                <Badge className="bg-red-500 text-white text-2xl px-6 py-2">
                  {partner.discount_percentage}% OFF
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {partner.partner_name}
                </h1>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {partner.description}
                </p>

                <div className="space-y-3">
                  {partner.location && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{partner.location}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-5 h-5" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                  {partner.website && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Globe className="w-5 h-5" />
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                        {partner.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {partner.promo_code && (
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 mt-6 md:mt-0 md:ml-6">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-green-100 mb-2">Exclusive Promo Code</p>
                    <p className="text-3xl font-bold font-mono mb-2">{partner.promo_code}</p>
                    <p className="text-sm text-green-100">Use at checkout</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Products</h2>
          <p className="text-gray-600">Redeem with PawPoints or get member discounts</p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No products available yet</h3>
              <p className="text-gray-600">Check back soon for exclusive offers!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden">
                  <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                        -{product.discount_percentage}%
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3">
                      {product.category}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.product_name}
                    </h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      {product.price_euro > 0 && (
                        <div>
                          <span className="text-2xl font-bold text-green-600">
                            €{product.price_euro.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {product.is_redeemable_with_points && product.points_cost > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
                            <span className="text-xl font-bold text-purple-600">
                              {product.points_cost}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">points</span>
                        </div>
                      )}
                    </div>

                    {product.stock_quantity !== undefined && (
                      <p className="text-sm text-gray-600 mb-4">
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </p>
                    )}

                    {product.is_redeemable_with_points && (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                        onClick={() => redeemProductMutation.mutate(product)}
                        disabled={
                          !loyaltyPoints || 
                          loyaltyPoints.points_balance < product.points_cost ||
                          product.stock_quantity === 0 ||
                          redeemProductMutation.isPending
                        }
                      >
                        {loyaltyPoints && loyaltyPoints.points_balance >= product.points_cost 
                          ? 'Redeem with Points' 
                          : `Need ${product.points_cost - (loyaltyPoints?.points_balance || 0)} more points`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <Card className="mt-12 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              How Point Redemption Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                <h4 className="font-semibold text-gray-900 mb-2">Choose Your Product</h4>
                <p className="text-gray-700">Browse available products and check point costs</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
                <h4 className="font-semibold text-gray-900 mb-2">Redeem Points</h4>
                <p className="text-gray-700">Click redeem and receive a unique redemption code</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
                <h4 className="font-semibold text-gray-900 mb-2">Collect or Receive</h4>
                <p className="text-gray-700">Show your code at the store or wait for delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}