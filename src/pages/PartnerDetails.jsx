import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, Globe, ShoppingBag, Star, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PartnerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
      if (!loyaltyPoints || loyaltyPoints.points_balance < product.points_cost) {
        throw new Error("Pontos insuficientes");
      }

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

      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: loyaltyPoints.points_balance - product.points_cost,
        total_redeemed: (loyaltyPoints.total_redeemed || 0) + product.points_cost
      });

      await base44.entities.PointsTransaction.create({
        user_email: user?.email,
        transaction_type: "redeemed",
        points_amount: product.points_cost,
        description: `Resgatado: ${product.product_name}`,
        balance_after: loyaltyPoints.points_balance - product.points_cost
      });

      return redemption;
    },
    onSuccess: (redemption) => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      toast.success(`Produto resgatado! Código: ${redemption.redemption_code}`);
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao resgatar");
    }
  });

  if (loadingPartner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <Skeleton className="h-64 rounded-xl mb-6" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Parceiro não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl('Partners'))}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate(createPageUrl('Partners'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Compact Header */}
        <Card className="border-0 shadow-xl mb-6">
          <div className="relative h-40 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.partner_name}
                className="max-h-32 max-w-[80%] object-contain"
              />
            ) : (
              <h1 className="text-4xl font-bold text-gray-700">{partner.partner_name}</h1>
            )}
            {partner.discount_percentage > 0 && (
              <Badge className="absolute top-4 right-4 bg-red-500 text-white text-xl px-4 py-2">
                -{partner.discount_percentage}%
              </Badge>
            )}
          </div>

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {partner.partner_name}
                </h1>
                <p className="text-gray-700 mb-4">
                  {partner.description}
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  {partner.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{partner.location}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{partner.phone}</span>
                    </div>
                  )}
                  {partner.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 text-sm">
                        {partner.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {partner.promo_code && (
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-green-100 mb-1">Código Promocional</p>
                    <p className="text-2xl font-bold font-mono mb-1">{partner.promo_code}</p>
                    <p className="text-xs text-green-100">Use no checkout</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Section - Compact */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Produtos Disponíveis</h2>
          <p className="text-gray-600 text-sm">Resgate com PawPoints ou obtenha descontos</p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sem produtos ainda</h3>
              <p className="text-gray-600">Em breve teremos ofertas exclusivas!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all overflow-hidden h-full">
                  {/* Product Image - Compact */}
                  <div className="relative h-40 bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {product.discount_percentage > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                        -{product.discount_percentage}%
                      </Badge>
                    )}
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">Esgotado</span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <Badge variant="outline" className="text-xs mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                      {product.product_name}
                    </h3>

                    {/* Price Display - Compact */}
                    <div className="mb-3">
                      {product.price_euro > 0 && (
                        <div className="text-xl font-bold text-green-600">
                          €{product.price_euro.toFixed(2)}
                        </div>
                      )}
                      {product.is_redeemable_with_points && product.points_cost > 0 && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Star className="w-4 h-4 fill-purple-500" />
                          <span className="font-bold">{product.points_cost}</span>
                          <span className="text-xs">pts</span>
                        </div>
                      )}
                    </div>

                    {product.stock_quantity !== undefined && product.stock_quantity > 0 && (
                      <p className="text-xs text-gray-600 mb-2">
                        {product.stock_quantity} em stock
                      </p>
                    )}

                    {product.is_redeemable_with_points && (
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-xs h-8"
                        onClick={() => redeemProductMutation.mutate(product)}
                        disabled={
                          !loyaltyPoints || 
                          loyaltyPoints.points_balance < product.points_cost ||
                          product.stock_quantity === 0 ||
                          redeemProductMutation.isPending
                        }
                      >
                        {loyaltyPoints && loyaltyPoints.points_balance >= product.points_cost 
                          ? 'Resgatar' 
                          : `Faltam ${product.points_cost - (loyaltyPoints?.points_balance || 0)} pts`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}