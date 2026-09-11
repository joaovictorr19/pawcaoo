import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { QrCode, CreditCard, Download, Megaphone, Flame, PackageSearch } from "lucide-react";
import DigitalWalletPass from "../professionals/DigitalWalletPass";
import DataExportInline from "../professionals/DataExportInline";
import StripeConnectSetup from "../professionals/StripeConnectSetup";
import HotelPromotionTools from "./HotelPromotionTools";
import CreateShopOfferModal from "../shop/CreateShopOfferModal";
import PickupLookupButton from "@/components/shop/PickupLookupButton";

export function ToolsSection({ user, professionalProfile, onEditProfile }) {
  const [iban, setIban] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [showOfferModal, setShowOfferModal] = React.useState(false);


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
      <h3 className="text-lg font-black text-slate-900 mb-2">Ferramentas Pro</h3>

      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-teal-50 rounded-xl border border-teal-200">
        <Megaphone className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <span className="text-xs font-bold text-teal-700">
          Ferramentas de Divulgação
        </span>
      </div>

      <HotelPromotionTools user={user} professionalProfile={professionalProfile} />

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <PackageSearch className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm">Procurar Recolha</h4>
            <p className="text-xs text-slate-400">Confirma encomendas no balcão pelo código</p>
          </div>
        </div>
        <PickupLookupButton partnerEmail={user?.email} className="w-full justify-center" />
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Oferta Relâmpago</h4>
            <p className="text-xs text-slate-500">Promove um serviço com desconto na Loja</p>
          </div>
        </div>
        <Button
          onClick={() => setShowOfferModal(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-xl py-2 text-sm"
        >
          Anunciar Oferta
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Cartão Digital PawGo</h4>
            <p className="text-xs text-slate-400">O seu passe de segurança</p>
          </div>
        </div>
        <div className="flex justify-center bg-slate-50 rounded-xl p-4">
           <DigitalWalletPass
              user={{ ...user, ...professionalProfile, username: user?.username || professionalProfile?.id }}
              profileType={professionalProfile?.walker_name ? "walker" : "trainer"}
              isVerified={professionalProfile?.is_verified || professionalProfile?.verification_status === 'verified'}
           />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Receber Pagamentos</h4>
            <p className="text-xs text-slate-400">Configuração Stripe Connect</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-slate-700">
          <StripeConnectSetup />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Levantamento por IBAN</h4>
            <p className="text-xs text-slate-400">Transfira o saldo para a sua conta bancária</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">IBAN</label>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Montante (€)</label>
            <Input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
          </div>
          <Button onClick={handleIbanWithdrawal} disabled={withdrawing || !iban || !amount} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2 text-sm disabled:opacity-50">
            {withdrawing ? 'A enviar...' : 'Solicitar Levantamento'}
          </Button>
          <p className="text-[11px] text-slate-400">Pedidos são processados em 1–2 dias úteis.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Exportação Fiscal</h4>
            <p className="text-xs text-slate-400">Faturas e relatórios</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-slate-700">
          <DataExportInline 
            professionalEmail={user?.email}
            country={professionalProfile?.country_of_operation}
          />
        </div>
      </div>

      <CreateShopOfferModal
        open={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        professionalProfile={professionalProfile}
        user={user}
      />
    </div>
  );
}