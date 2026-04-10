import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { QrCode, CreditCard, Download } from "lucide-react";
import DigitalWalletPass from "../professionals/DigitalWalletPass";
import DataExportPanel from "../professionals/DataExportPanel";
import StripeConnectSetup from "../professionals/StripeConnectSetup";

export function ToolsSection({ user, professionalProfile, onEditProfile }) {
  const [iban, setIban] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [withdrawing, setWithdrawing] = React.useState(false);

  const handleIbanWithdrawal = async () => {
    if (!user?.email || !iban || !amount) {
      toast.error("Preencha IBAN e montante.");
      return;
    }
    setWithdrawing(true);
    try {
      await base44.entities.IbanWithdrawalRequest.create({
        user_email: user.email,
        iban,
        amount: parseFloat(String(amount)),
        status: "pending"
      });
      toast.success("Pedido de levantamento enviado.");
      setIban("");
      setAmount("");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível enviar o pedido.");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-white mb-2">Ferramentas Pro</h3>
      
      
      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cartão Digital PawGo</h4>
              <p className="text-xs text-slate-400">O seu passe de segurança</p>
            </div>
          </div>
          <div className="flex justify-center bg-slate-950 rounded-xl p-4">
             <DigitalWalletPass
                user={{ ...user, ...professionalProfile, username: user?.username || professionalProfile?.id }}
                profileType={professionalProfile?.walker_name ? "walker" : "trainer"}
                isVerified={professionalProfile?.is_verified || professionalProfile?.verification_status === 'verified'}
             />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Receber Pagamentos</h4>
              <p className="text-xs text-slate-400">Configuração Stripe Connect</p>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4">
            <StripeConnectSetup />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Levantamento por IBAN</h4>
              <p className="text-xs text-slate-400">Transfira o saldo para a sua conta bancária</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block">IBAN</label>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" className="bg-slate-950 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Montante (€)</label>
              <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-slate-950 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <Button onClick={handleIbanWithdrawal} disabled={withdrawing || !iban || !amount} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg py-2 text-sm disabled:opacity-50">
              {withdrawing ? 'A enviar...' : 'Solicitar Levantamento'}
            </Button>
            <p className="text-[11px] text-slate-500">Pedidos são processados em 1–2 dias úteis.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Exportação Fiscal</h4>
              <p className="text-xs text-slate-400">Faturas e relatórios</p>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4">
             <DataExportPanel professionalEmail={user?.email} country={professionalProfile?.country_of_operation} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}