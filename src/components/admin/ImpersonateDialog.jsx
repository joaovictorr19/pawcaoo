import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Home, Building2, BarChart3, Calendar, User, Wallet, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const DESTINATIONS = [
  { id: "Home", label: "Início", icon: Home },
  { id: "UserProfile", label: "Perfil", icon: User },
  { id: "HotelDashboard", label: "Hotel", icon: Building2 },
  { id: "ProfessionalHubV2", label: "Painel Pro", icon: BarChart3 },
  { id: "ProfessionalCalendar", label: "Calendário", icon: Calendar },
  { id: "MyWallet", label: "Carteira", icon: Wallet },
];

export default function ImpersonateDialog({ user, isOpen, onClose }) {
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("Home");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast.error("Indica um motivo com pelo menos 5 caracteres (para auditoria).");
      return;
    }
    setLoading(true);
    try {
      const response = await base44.functions.invoke("impersonateUser", {
        targetUserId: user.id,
        reason: reason.trim(),
      });
      if (response.data?.success) {
        const impersonationPayload = {
          ...response.data.impersonationData,
          targetUserData: response.data.targetUserData
        };
        localStorage.setItem("impersonation", JSON.stringify(impersonationPayload));
        toast.success(`A entrar como ${user.full_name || user.email}...`);
        window.location.href = createPageUrl(destination);
      } else {
        toast.error(response.data?.error || "Erro ao iniciar sessão");
      }
    } catch (error) {
      toast.error("Erro: " + (error?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-admin-dialog max-w-[420px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/40">
          <DialogTitle className="flex items-center gap-2 text-red-700 text-base font-black">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Entrar como Utilizador
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-[11px] mt-1 leading-snug">
            Aceder à conta de <strong className="text-slate-800">{user.full_name || user.email}</strong>. Todas as ações são registadas.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="impersonate-reason" className="text-[11px] font-bold text-slate-600">Motivo (min. 5 caracteres)</Label>
            <Textarea
              id="impersonate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Verificar erro no checkout; corrigir perfil..."
              rows={2}
              className="resize-none rounded-lg bg-white/50 border-white/40 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-600">Página de destino</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {DESTINATIONS.map((d) => {
                const Icon = d.icon;
                const sel = destination === d.id;
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setDestination(d.id)}
                    className={"flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2.5 transition-all " + (sel ? "border-red-400 bg-red-50/70 ring-1 ring-red-300" : "border-white/40 bg-white/30 hover:bg-white/50")}
                  >
                    <Icon className={"w-4 h-4 " + (sel ? "text-red-600" : "text-slate-500")} />
                    <span className={"text-[11px] font-semibold leading-tight text-center " + (sel ? "text-red-700" : "text-slate-700")}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-amber-50/80 border border-amber-200/60 px-3 py-2 text-[11px] text-amber-800 leading-snug">
            ⚠️ Acesso total ao perfil e funcionalidades. Sessão expira em 2h. Usa "Voltar a Admin" para terminar.
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 border-t border-white/40 flex-row gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-lg bg-white/50 border-white/40 flex-1 h-9 text-sm">Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 5}
            className="rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white flex-1 h-9 text-sm shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldAlert className="w-4 h-4 mr-1.5" />}
            {loading ? "A iniciar..." : "Entrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}