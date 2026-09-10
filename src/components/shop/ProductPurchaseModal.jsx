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

        <div className="px-5 pb-5 space-y-5">
          {/* Resumo do produto */}
          <div className="flex gap-3 items-center bg-slate-50 rounded-2xl p-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-400" />
              </div>
              {product.image_url && (
                <img src={product.image_url} alt={product.product_name} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="relative w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{product.product_name}</p>
              <p className="text-xs text-slate-500">{product.partner_name}</p>
              <p className="text-sm font-bold text-teal-700 mt-0.5">€{(product.price_euro || 0).toFixed(2)} / un.</p>
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <Label className="text-sm font-semibold">Quantidade</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                className="h-9 w-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-lg text-slate-900">{quantity}</span>
              <button
                type="button"
                className="h-9 w-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 ml-1">{product.stock_quantity} em stock</span>
            </div>
          </div>

          {/* Entrega */}
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <delivery.icon className="w-4 h-4 text-teal-600" />
              <p className="text-sm font-semibold text-slate-800">{delivery.label}</p>
            </div>
            <p className="text-xs text-slate-500 -mt-1">{delivery.hint}</p>
            {product.delivery_method === "shipping" && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <Label className="text-xs">Rua e número *</Label>
                  <Input
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="Rua das Flores, 123"
                    className="mt-1 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs">Código Postal *</Label>
                    <Input
                      value={address.postal_code}
                      onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                      placeholder="1000-001"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade *</Label>
                    <Input
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="Lisboa"
                      className="mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Pagamento</Label>
            {walletBalance > 0 ? (
              <button
                type="button"
                onClick={() => setUseWallet((v) => !v)}
                className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-all ${
                  useWallet
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Wallet className={`w-5 h-5 ${useWallet ? "text-teal-600" : "text-slate-400"}`} />
                  <span className="text-sm font-semibold text-slate-800">
                    Usar saldo PawCão
                    <span className="block text-xs font-normal text-slate-500">
                      Disponível: €{walletBalance.toFixed(2)}
                      {walletBalance < total ? " — restante por cartão" : ""}
                    </span>
                  </span>
                </span>
                <span
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    useWallet ? "bg-teal-500 border-teal-500" : "border-slate-300"
                  }`}
                >
                  {useWallet && <span className="text-white text-xs font-bold">✓</span>}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">Pagamento seguro por cartão (Stripe)</span>
              </div>
            )}
          </div>

          {/* Total + botão */}
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl px-4 py-3 border border-teal-100">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-xl font-black text-teal-700">€{total.toFixed(2)}</span>
          </div>

          {!user ? (
            <Button
              onClick={() => navigate(`/login?from=${encodeURIComponent("/Shop")}`)}
              className="w-full h-12 text-base font-bold hero-cta-teal text-white"
            >
              Entrar para comprar
            </Button>
          ) : (
            <Button
              onClick={handleBuy}
              disabled={processing || (product.stock_quantity || 0) < 1}
              className="w-full h-12 text-base font-bold hero-cta-teal text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  {useWallet && walletBalance >= total ? <Wallet className="w-5 h-5 mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                  Pagar €{total.toFixed(2)}
                </>
              )}
            </Button>
          )}
          <p className="text-[11px] text-slate-400 text-center">
            Pagamento seguro · Cartão (Stripe) ou saldo PawCão
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}