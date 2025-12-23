import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function ShoppingCartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout }) {
  const { language } = useLanguage();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
    country: "Portugal"
  });
  
  const verifyCouponMutation = useMutation({
    mutationFn: async (code) => {
      const coupons = await base44.entities.Coupon.filter({ code, is_active: true });
      return coupons[0];
    },
    onSuccess: (coupon) => {
      if (!coupon) {
        toast.error(language === 'pt' ? 'Cupom inválido' : 'Invalid coupon');
        return;
      }
      setAppliedCoupon(coupon);
      toast.success(language === 'pt' ? 'Cupom aplicado!' : 'Coupon applied!');
    },
  });

  const subtotal = cart?.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
  
  let discount = 0;
  if (appliedCoupon) {
    if (subtotal >= appliedCoupon.min_purchase) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = (subtotal * appliedCoupon.discount_value) / 100;
      } else {
        discount = appliedCoupon.discount_value;
      }
    }
  }

  const shipping = 5;
  const total = subtotal - discount + shipping;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Carrinho de Compras
          </DialogTitle>
        </DialogHeader>

        {!cart?.items || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">O seu carrinho está vazio</p>
            <Button onClick={onClose} variant="outline">
              Continuar a Comprar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.items.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{item.product_name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{item.partner_name}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-900">
                        €{item.total_price.toFixed(2)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => onRemoveItem(item.product_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            {/* Coupon Section */}
            <div className="space-y-3 pt-4">
              <Label className="text-sm font-semibold">{language === 'pt' ? 'Código de Desconto' : 'Coupon Code'}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'pt' ? 'Digite o código' : 'Enter code'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => verifyCouponMutation.mutate(couponCode)}
                  disabled={!couponCode}
                  size="sm"
                >
                  <Ticket className="w-4 h-4 mr-1" />
                  {language === 'pt' ? 'Aplicar' : 'Apply'}
                </Button>
              </div>
              {appliedCoupon && (
                <div className="bg-green-50 p-2 rounded text-sm text-green-700">
                  ✓ {appliedCoupon.code} - {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `€${appliedCoupon.discount_value}`} {language === 'pt' ? 'de desconto' : 'off'}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">€{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{language === 'pt' ? 'Desconto' : 'Discount'}</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envio</span>
                <span className="font-semibold">€{shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-600">€{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Continuar a Comprar
              </Button>
              <Button 
                onClick={onCheckout}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Finalizar Compra
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}