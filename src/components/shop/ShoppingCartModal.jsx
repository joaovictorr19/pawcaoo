import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Ticket, Truck, MapPin, CreditCard, Package, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function ShoppingCartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // cart | address | payment
  const [processingCheckout, setProcessingCheckout] = useState(false);
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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

  const shipping = subtotal >= 50 ? 0 : 5;
  const total = subtotal - discount + shipping;

  const handleCheckout = async () => {
    if (checkoutStep === "cart") {
      setCheckoutStep("address");
      return;
    }

    if (checkoutStep === "address") {
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postal_code) {
        toast.error("Preencha todos os campos da morada");
        return;
      }
      setCheckoutStep("payment");
      return;
    }

    if (checkoutStep === "payment") {
      setProcessingCheckout(true);
      try {
        const response = await base44.functions.invoke('createProductCheckout', {
          items: cart.items,
          shipping_address: shippingAddress,
          coupon_code: appliedCoupon?.code || null
        });

        if (response.data?.url) {
          // Limpar carrinho antes de redirecionar
          await base44.entities.ShoppingCart.update(cart.id, {
            items: [],
            total_items: 0,
            subtotal: 0
          });
          queryClient.invalidateQueries(['shoppingCart']);
          
          window.location.href = response.data.url;
        } else {
          toast.error("Erro ao criar sessão de pagamento");
          setProcessingCheckout(false);
        }
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Erro ao processar checkout");
        setProcessingCheckout(false);
      }
    }
  };

  const handleClose = () => {
    setCheckoutStep("cart");
    setAppliedCoupon(null);
    setCouponCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              Carrinho de Compras
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-2 ${checkoutStep === 'cart' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'cart' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                {checkoutStep === 'cart' ? '1' : '✓'}
              </div>
              <span className="text-xs font-medium">Carrinho</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200" />
            <div className={`flex items-center gap-2 ${checkoutStep === 'address' ? 'text-blue-600' : checkoutStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'address' ? 'bg-blue-600 text-white' : checkoutStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {checkoutStep === 'payment' ? '✓' : '2'}
              </div>
              <span className="text-xs font-medium">Morada</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200" />
            <div className={`flex items-center gap-2 ${checkoutStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${checkoutStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-xs font-medium">Pagamento</span>
            </div>
          </div>
        </DialogHeader>

        {!cart?.items || cart.items.length === 0 ? (
          <div className="text-center py-16 px-6">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">O seu carrinho está vazio</p>
            <p className="text-gray-500 text-sm mb-6">Adicione produtos para começar</p>
            <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
              Continuar a Comprar
            </Button>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {checkoutStep === "cart" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {cart.items.map((item, index) => (
                    <div key={`${item.product_id}-${index}`} className="flex gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm mb-0.5 line-clamp-1">{item.product_name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{item.partner_name}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => onUpdateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-gray-900">
                              €{item.total_price.toFixed(2)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              onClick={() => onRemoveItem(item.product_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-4 h-px bg-gray-200" />

                {/* Coupon Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-purple-600" />
                    Código de Desconto
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 h-10"
                    />
                    <Button
                      variant="outline"
                      onClick={() => verifyCouponMutation.mutate(couponCode)}
                      disabled={!couponCode || verifyCouponMutation.isPending}
                      className="h-10"
                    >
                      {verifyCouponMutation.isPending ? 'A verificar...' : 'Aplicar'}
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-sm text-green-700 font-medium">
                        ✓ {appliedCoupon.code} - {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `€${appliedCoupon.discount_value}`} de desconto
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setAppliedCoupon(null)}
                        className="h-6 text-red-500 hover:text-red-600"
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                <div className="my-4 h-px bg-gray-200" />

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.total_items} {cart.total_items === 1 ? 'item' : 'itens'})</span>
                    <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Desconto
                      </span>
                      <span className="font-semibold">-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Truck className="w-3 h-3" />
                      Envio {subtotal >= 50 && <Badge className="bg-green-500 text-[10px] py-0 h-4">Grátis</Badge>}
                    </span>
                    <span className="font-semibold">{shipping === 0 ? 'Grátis' : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-gray-500">
                      Faltam €{(50 - subtotal).toFixed(2)} para envio grátis
                    </p>
                  )}
                  <div className="my-2 h-px bg-gray-300" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">€{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Continuar a Comprar
                  </Button>
                  <Button 
                    onClick={handleCheckout}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {checkoutStep === "address" && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold">Morada de Entrega</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Rua e Número *</Label>
                    <Input
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      placeholder="Rua das Flores, 123"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Código Postal *</Label>
                      <Input
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                        placeholder="1000-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Cidade *</Label>
                      <Input
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        placeholder="Lisboa"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>País</Label>
                    <Input
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Order Summary Compact */}
                <div className="bg-gray-50 p-3 rounded-lg mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{cart.total_items} itens</span>
                    <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mb-2">
                      <span>Desconto</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Envio</span>
                    <span className="font-semibold">{shipping === 0 ? 'Grátis' : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="my-2 h-px bg-gray-300" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">€{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setCheckoutStep("cart")} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleCheckout}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11"
                  >
                    Continuar para Pagamento
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {checkoutStep === "payment" && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold">Confirmar e Pagar</h3>
                </div>

                {/* Review Order */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <h4 className="font-semibold text-sm">Entregar em:</h4>
                  </div>
                  <p className="text-sm text-gray-700 pl-6">
                    {shippingAddress.street}<br />
                    {shippingAddress.postal_code}, {shippingAddress.city}<br />
                    {shippingAddress.country}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCheckoutStep("address")}
                    className="text-blue-600 hover:text-blue-700 pl-6"
                  >
                    Alterar morada
                  </Button>
                </div>

                {/* Items Summary */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-gray-500" />
                    <h4 className="font-semibold text-sm">{cart.total_items} {cart.total_items === 1 ? 'Produto' : 'Produtos'}</h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm pl-6">
                        <span className="text-gray-600">{item.quantity}x {item.product_name}</span>
                        <span className="font-medium">€{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Total */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span className="font-semibold">-€{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envio</span>
                      <span className="font-semibold">{shipping === 0 ? 'Grátis' : `€${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="my-2 h-px bg-gray-300" />
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total a Pagar</span>
                      <span className="text-blue-600">€{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setCheckoutStep("address")} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleCheckout}
                    disabled={processingCheckout}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base font-bold"
                  >
                    {processingCheckout ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        A processar...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar €{total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Pagamento seguro via Stripe
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}