import React from "react";
import { CheckCircle, Package, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PickupInfoBlock from "@/components/shop/PickupInfoBlock";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');

  const { data: order, isLoading } = useQuery({
    queryKey: ['orderSuccess', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const orders = await base44.entities.ProductOrder.filter({ id: orderId });
      return orders[0] || null;
    },
    enabled: !!orderId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const isPickup = order?.delivery_method === 'pickup' && !!order?.pickup_code;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="glass-panel max-w-lg w-full">
        <CardContent className="p-8 md:p-12 text-center">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold mb-3 text-slate-900">
                {language === 'pt' ? 'Encomenda Confirmada!' : 'Order Confirmed!'}
              </h1>

              <p className="text-slate-600 mb-6">
                {language === 'pt'
                  ? 'Obrigado pela tua compra! Receberás um email de confirmação em breve.'
                  : 'Thank you for your purchase! You will receive a confirmation email shortly.'}
              </p>

              {order?.order_number && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    {language === 'pt' ? 'Número da Encomenda' : 'Order Number'}: <strong>{order.order_number}</strong>
                  </p>
                </div>
              )}

              {isPickup && (
                <div className="text-left mb-6">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <p className="text-sm font-bold text-slate-900">Recolha no local</p>
                  </div>
                  <PickupInfoBlock
                    code={order.pickup_code}
                    address={order.pickup_address}
                    city={order.pickup_city}
                    postal_code={order.pickup_postal_code}
                    notes={order.pickup_notes}
                    schedule={order.pickup_schedule}
                  />
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => navigate(createPageUrl('MyOrders'))}>
                  <Package className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Ver Encomendas' : 'View Orders'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/Shop')}>
                  {language === 'pt' ? 'Continuar Compras' : 'Continue Shopping'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}