import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CreditCard, Download, ExternalLink } from "lucide-react";
import DigitalWalletPass from "../professionals/DigitalWalletPass";
import DataExportPanel from "../professionals/DataExportPanel";
import StripeConnectSetup from "../professionals/StripeConnectSetup";

export function ToolsSection({ user, professionalProfile }) {
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