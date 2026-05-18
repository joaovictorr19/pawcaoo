import React from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PendingApproval({ profile, activeTab, onChangeTab }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-md w-full text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-xl font-black mb-2">Aguardando aprovação</h1>
        <p className="text-slate-400 text-sm mb-4">
          O seu perfil profissional está em análise pelos administradores.
          Assim que for aprovado, o seu painel ficará disponível.
        </p>
        {profile?.verification_status && (
          <p className="text-xs text-slate-500 mb-4 flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Estado atual: <span className="uppercase tracking-wider font-bold">{String(profile.verification_status)}</span>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            onClick={() => (window.location.href = createPageUrl('Home'))}
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-2xl"
          >
            Voltar
          </Button>
          <Button
            onClick={() => onChangeTab?.(activeTab === 'portfolio' ? 'documents' : 'portfolio')}
            variant="outline"
            className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10 rounded-2xl"
          >
            {activeTab === 'portfolio' ? 'Ver documentos' : 'Ver portfólio'}
          </Button>
          <Button
            onClick={() => onChangeTab?.('documents')}
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl"
          >
            Abrir documentos
          </Button>
        </div>
      </div>
    </div>
  );
}