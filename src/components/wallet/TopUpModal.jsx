import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [10, 25, 50, 100];
const MIN = 5;

export default function TopUpModal({ open, onOpenChange, onConfirm, isLoading }) {
  const [credits, setCredits] = useState("");

  const amount = parseFloat(credits) || 0;
  const valid = amount >= MIN;

  const submit = () => {
    if (!valid) { toast.error(`Mínimo €${MIN}`); return; }
    onConfirm(amount);
  };

  const close = () => { setCredits(""); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-[380px] rounded-[20px] border border-slate-200 bg-white p-0 shadow-xl overflow-hidden" showCloseButton={false}>
        {/* Compact header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Carregar Wallet</h2>
          <button onClick={close} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Preset pills */}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setCredits(v.toString())}
                className={`h-10 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                  credits === v.toString()
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                €{v}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">€</span>
            <Input
              type="number"
              placeholder="Outro valor"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              min={MIN}
              className="h-11 rounded-xl border-slate-200 pl-8 text-sm font-semibold"
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">Total</span>
            <span className="text-lg font-black text-slate-900">€{amount.toFixed(2)}</span>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            {/* Apple Pay */}
            <button
              onClick={submit}
              disabled={!valid || isLoading}
              className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ApplePayLogo />
              )}
            </button>

            {/* Card */}
            <Button
              onClick={submit}
              disabled={!valid || isLoading}
              className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar para pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplePayLogo() {
  return (
    <svg width="51" height="20" viewBox="0 0 51 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.50342 2.58643C9.89502 2.08154 10.1636 1.3916 10.0913 0.69043C9.52539 0.717285 8.84131 1.05273 8.43848 1.55713C8.0752 1.99951 7.75342 2.70508 7.83838 3.38867C8.47217 3.43701 9.11768 3.08057 9.50342 2.58643Z" />
      <path d="M10.0845 3.51904C9.16943 3.46533 8.37891 4.03857 7.93408 4.03857C7.47803 4.03857 6.80322 3.54639 6.07129 3.55859C5.13037 3.57275 4.25635 4.11279 3.77979 4.96143C2.79346 6.67041 3.52539 9.19336 4.48926 10.5801C4.95557 11.2666 5.50928 12.0264 6.25293 12.0015C6.96582 11.9761 7.24512 11.5469 8.11328 11.5469C8.98145 11.5469 9.23242 12.0015 9.97754 11.9854C10.7495 11.9761 11.2261 11.2974 11.6924 10.6094C12.2183 9.82568 12.4365 9.06152 12.4482 9.02344C12.4321 9.01758 10.8989 8.42969 10.8843 6.74512C10.8706 5.33496 12.0996 4.63428 12.1558 4.59814C11.4604 3.57666 10.3843 3.51904 10.0845 3.51904Z" />
      <path d="M18.0776 1.49023C20.0903 1.49023 21.4946 2.88037 21.4946 4.89746C21.4946 6.92236 20.0601 8.31982 18.0249 8.31982H15.8232V12.5396H14.2246V1.49023H18.0776ZM15.8232 6.96924H17.6216C18.957 6.96924 19.7446 6.23193 19.7446 4.90479C19.7446 3.57812 18.957 2.84814 17.6294 2.84814H15.8232V6.96924Z" />
      <path d="M21.8975 10.3335C21.8975 8.86279 23.0225 7.99512 25.0161 7.89404L27.2754 7.76221V7.04443C27.2754 6.00439 26.5864 5.43457 25.4453 5.43457C24.3662 5.43457 23.6851 5.94238 23.5142 6.78076H22.0649C22.1567 5.23193 23.522 4.04541 25.5078 4.04541C27.4937 4.04541 28.8506 5.20117 28.8506 6.91455V12.5396H27.3374V11.1733H27.3008C26.8237 12.1235 25.7524 12.7173 24.6353 12.7173C23.0449 12.7173 21.8975 11.7515 21.8975 10.3335ZM27.2754 9.66016V8.92676L25.2397 9.05859C24.0986 9.13184 23.4644 9.60889 23.4644 10.3945C23.4644 11.1953 24.1245 11.7031 25.1631 11.7031C26.3818 11.7031 27.2754 10.8574 27.2754 9.66016Z" />
      <path d="M30.3125 15.8105V14.499C30.4365 14.5283 30.708 14.5283 30.8398 14.5283C31.5728 14.5283 31.9614 14.2197 32.2197 13.4268L32.3516 13.0156L29.5859 4.23193H31.2144L33.1421 11.5195H33.1714L35.0991 4.23193H36.6865L33.8037 13.3457C33.1465 15.4556 32.3647 16.1514 30.6416 16.1514C30.5176 16.1514 30.4365 16.1445 30.3125 16.1152V15.8105Z" />
    </svg>
  );
}