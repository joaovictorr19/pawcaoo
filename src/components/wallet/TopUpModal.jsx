import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Loader2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [10, 25, 50, 100];
const MIN_AMOUNT = 5;

export default function TopUpModal({ open, onOpenChange, onConfirm, isLoading }) {
  const [credits, setCredits] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);

  const amount = parseFloat(credits) || 0;
  const isValid = amount >= MIN_AMOUNT;

  const handlePreset = (v) => {
    setSelectedPreset(v);
    setCredits(v.toString());
  };

  const handleCustom = (e) => {
    setSelectedPreset(null);
    setCredits(e.target.value);
  };

  const handleSubmit = (method) => {
    if (!isValid) {
      toast.error(`Valor mínimo: €${MIN_AMOUNT}`);
      return;
    }
    onConfirm(amount, method);
  };

  const handleClose = () => {
    setCredits("");
    setSelectedPreset(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              Carregar Wallet
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-white/85">
            Adicione saldo à sua carteira para usar em passeios, treinos e serviços.
          </p>
        </div>

        <div className="space-y-5 p-6">
          {/* Preset amounts */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
              Valores rápidos
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handlePreset(v)}
                  className={`rounded-2xl border px-2 py-3 text-center transition-all active:scale-95 ${
                    selectedPreset === v
                      ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm ring-2 ring-teal-500/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-bold">€{v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Valor personalizado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                €
              </span>
              <Input
                type="number"
                placeholder="0,00"
                value={credits}
                onChange={handleCustom}
                min={MIN_AMOUNT}
                step="1"
                className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-9 text-lg font-bold text-slate-900 focus-visible:ring-teal-400 focus-visible:border-teal-400"
              />
            </div>
            <p className="text-xs text-slate-400">Valor mínimo: €{MIN_AMOUNT}</p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
            <span className="text-sm font-medium text-slate-500">Total a pagar</span>
            <span className="text-2xl font-black text-slate-900">
              €{amount.toFixed(2)}
            </span>
          </div>

          {/* Payment buttons */}
          <div className="space-y-3">
            {/* Apple Pay button */}
            <button
              type="button"
              onClick={() => handleSubmit("apple_pay")}
              disabled={!isValid || isLoading}
              className="w-full h-13 rounded-2xl bg-black text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800"
              style={{ minHeight: "3.25rem" }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ApplePayIcon />
                  <span className="text-base">Pagar com Apple Pay</span>
                </>
              )}
            </button>

            {/* Continue to payment button */}
            <Button
              type="button"
              onClick={() => handleSubmit("card")}
              disabled={!isValid || isLoading}
              className="w-full h-13 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base disabled:opacity-40"
              style={{ minHeight: "3.25rem" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> A abrir pagamento...
                </>
              ) : (
                "Continuar para pagamento"
              )}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saldo imediato</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplePayIcon() {
  return (
    <svg
      width="16"
      height="19"
      viewBox="0 0 16 19"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path d="M13.2372 10.0459C13.2095 7.52295 15.3197 6.29102 15.4124 6.2373C14.2241 4.50879 12.3748 4.27051 11.7227 4.24707C10.1729 4.08789 8.67432 5.15723 7.89014 5.15723C7.08936 5.15723 5.87695 4.2627 4.56348 4.29102C2.87354 4.31641 1.29395 5.30176 0.431152 6.82031C-1.35986 9.91895 -0.0942383 14.4473 1.23389 16.9365C1.89844 18.1572 2.67676 19.5176 3.72217 19.4688C4.75342 19.415 5.13867 18.665 6.37354 18.665C7.59424 18.665 7.94971 19.4688 9.02295 19.4414C10.1313 19.415 10.8306 18.21 11.4756 16.9805C12.2446 15.5752 12.5566 14.1973 12.5703 14.1318C12.5459 14.1221 13.2686 13.3262 13.2372 10.0459Z" />
      <path d="M11.0264 2.84375C11.5947 2.1543 11.9795 1.19336 11.8701 0.224609C11.0479 0.258789 10.0225 0.776367 9.43359 1.46582C8.9043 2.0752 8.44238 3.05273 8.56836 4.00195C9.48926 4.07324 10.4438 3.53027 11.0264 2.84375Z" />
    </svg>
  );
}