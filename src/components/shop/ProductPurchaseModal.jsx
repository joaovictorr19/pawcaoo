import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Minus, Plus, Truck, MapPin, Hotel, Wallet, CreditCard, Loader2, Package
} from "lucide-react";

const DELIVERY = {
  shipping: { label: "Entrega ao domicílio", icon: Truck, hint: "Vai ser entregue na sua morada" },
  pickup: { label: "Recolha no local", icon: MapPin, hint: "Combinará a recolha diretamente com o parceiro" },
  with_stay: { label: "Na próxima estadia", icon: Hotel, hint: "Será adicionado à sua próxima estadia" },
};

export default function ProductPurchaseModal({ product, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [useWallet, setUseWallet] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState({ street: "", postal_code: "", city: "", country: "Portugal" });

  const { data: user } = useQuery({
    queryKey: ["shopCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: walletBalance = 0 } = useQuery({
    queryKey: ["shopWalletBalance"],
    queryFn: async () => {
      try {
        const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
        return Math.round((wallets[0]?.cashback_balance || 0) * 100) / 100;
      } catch {
        return 0;
      }
    },
    enabled: !!user?.email,
  });

  if (!product) return null;

  const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
  const maxQty = Math.max(1, product.stock_quantity || 1);
  const total = Math.round((product.price_euro || 0) * quantity * 100) / 100;

  const handleBuy = async () => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
      return;
    }
    if (product.delivery_method === "shipping" && (!address.street || !address.city || !address.postal_code)) {
      toast.error("Preenche a morada de entrega completa");
      return;
    }
    setProcessing(true);
    try {
      const response = await base44.functions.invoke("createProductOrderCheckout", {
        product_id: product.id,
        quantity,
        use_wallet: useWallet && walletBalance > 0,
        shipping_address: product.delivery_method === "shipping" ? address : null,
      });
      const data = response.data;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.paid) {
        toast.success("Compra confirmada com sucesso! 🐾");
        queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
        queryClient.invalidateQueries({ queryKey: ["shopWalletBalance"] });
        onClose();
        navigate(`/OrderSuccess?order_id=${data.order_id}`);
        return;
      }
      toast.error(data?.error || "Não foi possível processar a compra");
      setProcessing(false);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error?.response?.data?.error || "Erro ao processar compra");
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold text-slate-900">
            <Package className="w-5 h-5 text-teal-600" />
            Comprar
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4">
          {/* Resumo do produto — banner horizontal */}
          <div className="flex gap-3 items-center bg-slate-100 rounded-xl p-2.5">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              {product.image_url && (
                <img src={product.image_url} alt={product.product_name} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="relative w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-sm leading-tight truncate">{product.product_name}</p>
              <p className="text-xs text-slate-500">{product.partner_name}</p>
            </div>
            <p className="font-bold text-slate-900 text-sm whitespace-nowrap">€{(product.price_euro || 0).toFixed(2)}<span className="text-xs text-slate-400 font-normal"> / un.</span></p>
          </div>

          {/* Quantidade — row with hairline */}
          <div className="pt-4 pb-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-900">Quantidade</Label>
              <span className="text-xs text-slate-400">{product.stock_quantity} em stock</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-base text-slate-900">{quantity}</span>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Entrega — borderless with hairline */}
          <div className="pt-3.5 pb-3.5 border-b border-slate-100">
            <Label className="text-sm font-bold text-slate-900">Entrega</Label>
            <div className="flex items-center gap-2 mt-2">
              <delivery.icon className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-sm font-medium text-slate-700">{delivery.label}</p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{delivery.hint}</p>
            {product.delivery_method === "shipping" && (
              <div className="space-y-2 mt-3">
                <Input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Rua e número"
                  className="bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={address.postal_code}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    placeholder="Código Postal"
                    className="bg-white"
                  />
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Cidade"
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pagamento — borderless with hairline */}
          <div className="pt-3.5 pb-3.5 border-b border-slate-100">
            <Label className="text-sm font-bold text-slate-900">Pagamento</Label>
            {walletBalance > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setUseWallet((v) => !v)}
                  className="w-full flex items-center justify-between mt-2 py-1"
                >
                  <span className="flex items-center gap-2.5">
                    <Wallet className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 text-left">
                      Usar saldo PawCão
                      <span className="block text-xs font-normal text-slate-500">
                        Disponível: €{walletBalance.toFixed(2)}
                        {walletBalance < total ? " — restante por cartão" : ""}
                      </span>
                    </span>
                  </span>
                  <span className={`w-9 h-5 rounded-full flex items-center justify-center transition-all ${useWallet ? "bg-teal-600" : "bg-slate-300"}`}>
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${useWallet ? "translate-x-2" : "-translate-x-2"}`} />
                  </span>
                </button>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] text-slate-400">ou</span>
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Cartão (Stripe)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5 mt-2 py-1">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Pagamento seguro por cartão (Stripe)</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-400 text-center pt-3">
            Pagamento seguro · Cartão (Stripe) ou saldo PawCão
          </p>
        </div>

        {/* Sticky bottom action bar */}
        <div className="sticky bottom-0 px-5 pb-5 pt-2 bg-white border-t border-slate-100">
          {!user ? (
            <button
              onClick={() => navigate(`/login?from=${encodeURIComponent("/Shop")}`)}
              className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold flex items-center justify-between px-5 shadow-lg transition-all active:scale-[0.98]"
            >
              <span className="text-sm font-medium opacity-90">Entrar para comprar</span>
              <span>€{total.toFixed(2)}</span>
            </button>
          ) : (
            <button
              onClick={handleBuy}
              disabled={processing || (product.stock_quantity || 0) < 1}
              className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-base font-bold flex items-center justify-between px-5 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center gap-2 mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A processar...
                </span>
              ) : (
                <>
                  <span className="text-sm font-medium opacity-90">Total</span>
                  <span className="flex items-center gap-2">
                    {useWallet && walletBalance >= total ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    Pagar €{total.toFixed(2)}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}