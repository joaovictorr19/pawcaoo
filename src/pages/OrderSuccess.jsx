import React from "react";
import { CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="glass-panel max-w-lg w-full">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            {language === 'pt' ? 'Encomenda Confirmada!' : 'Order Confirmed!'}
          </h1>
          
          <p className="text-gray-600 mb-8">
            {language === 'pt' 
              ? 'Obrigado pela sua compra! Receberá um email de confirmação em breve.'
              : 'Thank you for your purchase! You will receive a confirmation email shortly.'}
          </p>

          {orderId && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                {language === 'pt' ? 'Número da Encomenda' : 'Order Number'}: <strong>{orderId}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(createPageUrl('MyOrders'))}>
              <Package className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Ver Encomendas' : 'View Orders'}
            </Button>
            <Button variant="outline" onClick={() => navigate(createPageUrl("Partners"))}>
              {language === 'pt' ? 'Continuar Compras' : 'Continue Shopping'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}