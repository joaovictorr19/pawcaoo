import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldAlert, Home, Building2, BarChart3, Calendar, User, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const DESTINATIONS = [
  { id: "Home", label: "Página Inicial", icon: Home, desc: "Ver a home como o usuário vê" },
  { id: "UserProfile", label: "Perfil do Usuário", icon: User, desc: "Ver/editar perfil público" },
  { id: "HotelDashboard", label: "Painel do Hotel", icon: Building2, desc: "Gestão hoteleira" },
  { id: "ProfessionalHubV2", label: "Painel Profissional", icon: BarChart3, desc: "Dashboard do profissional" },
  { id: "ProfessionalCalendar", label: "Calendário", icon: Calendar, desc: "Agenda e disponibilidade" },
  { id: "MyWallet", label: "Carteira", icon: Wallet, desc: "Saldos e transações" },
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="w-5 h-5" />
            Entrar como Utilizador
          </DialogTitle>
          <DialogDescription>
            Vais aceder à conta de <strong className="text-slate-800">{user.full_name || user.email}</strong> para manutenção e debug.
            Todas as ações são registadas para auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="impersonate-reason">Motivo (obrigatório, min. 5 caracteres)</Label>
            <Textarea
              id="impersonate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Verificar erro no checkout do hotel; corrigir perfil; debug de reservas..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Página de destino</Label>
            <RadioGroup value={destination} onValueChange={setDestination} className="grid grid-cols-2 gap-2">
              {DESTINATIONS.map((d) => {
                const Icon = d.icon;
                return (
                  <label
                    key={d.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                      destination === d.id
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <RadioGroupItem value={d.id} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-800">{d.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            ⚠️ Terás acesso total ao perfil, hotel, reservas, carteira e todas as funcionalidades do utilizador.
            A sessão expira em 2 horas. Usa o botão "Voltar a Admin" no rodapé para terminar.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 5}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
          >
            {loading ? "A iniciar..." : "Entrar como Utilizador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}