import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PauseCircle, PlayCircle, FileText, Loader2, CheckCircle2,
  XCircle, Clock, AlertTriangle, Save, ExternalLink
} from "lucide-react";
import AdminCommissionManager from "@/components/admin/AdminCommissionManager";
import ProfileUpdateRequestDialog from "@/components/admin/ProfileUpdateRequestDialog";
import { ensureProfileSlug } from "@/utils/profileSlug";
import { Mail } from "lucide-react";

const VERIFICATION_LABELS = {
  requires_documents: { label: "Documentos necessários", color: "text-amber-500", bg: "bg-amber-50", icon: AlertTriangle },
  pending:            { label: "Em verificação",          color: "text-blue-500",   bg: "bg-blue-50",   icon: Clock },
  verified:           { label: "Verificado",               color: "text-emerald-600",bg: "bg-emerald-50",icon: CheckCircle2 },
  rejected:           { label: "Rejeitado",                color: "text-red-500",    bg: "bg-red-50",    icon: XCircle },
};

export default function AdminProfessionalManageModal({
  walker,
  isOpen,
  onClose,
  onToggleActive,
}) {
  const queryClient = useQueryClient();
  const [savingCommission, setSavingCommission] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [mode, setMode] = useState(walker?.commission_rate_mode || "default");
  const [customRate, setCustomRate] = useState(String(walker?.custom_commission_rate || ""));
  const [expiryDate, setExpiryDate] = useState(walker?.commission_rate_expiry || "");
  const [zeroMonths, setZeroMonths] = useState("3");
  const [borneBy, setBorneBy] = useState(walker?.commission_borne_by || "hotel");
  const [showUpdateRequest, setShowUpdateRequest] = useState(false);

  useEffect(() => {
    if (walker) {
      setMode(walker.commission_rate_mode || "default");
      setCustomRate(String(walker.custom_commission_rate || ""));
      setExpiryDate(walker.commission_rate_expiry || "");
      setBorneBy(walker.commission_borne_by || "hotel");
    }
  }, [walker?.id]);

  if (!walker) return null;

  const vs = VERIFICATION_LABELS[walker.verification_status] || VERIFICATION_LABELS.requires_documents;
  const VsIcon = vs.icon;

  const handleTogglePause = async () => {
    setToggling(true);
    try {
      await onToggleActive(walker);
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      toast.success(walker.is_active ? "Perfil pausado." : "Perfil reativado!");
    } catch (e) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setToggling(false);
    }
  };

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    try {
      const updates = {
        commission_rate_mode: mode,
        commission_borne_by: borneBy,
        exempt_from_platform_fees: mode === "zero" || mode === "zero_temporary",
      };
      if (mode === "custom_percent") {
        updates.custom_commission_rate = Number(customRate) || 0;
      }
      if (mode === "zero_temporary" && expiryDate) {
        updates.commission_rate_expiry = expiryDate;
      } else if (mode !== "zero_temporary") {
        updates.commission_rate_expiry = null;
      }
      await base44.entities.WalkerProfile.update(walker.id, updates);
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      toast.success("Comissão atualizada com sucesso!");
    } catch (e) {
      toast.error("Erro ao guardar comissão.");
    } finally {
      setSavingCommission(false);
    }
  };

  const openProfile = async () => {
    const link = await ensureProfileSlug(
      walker.hotel_details?.hotel_name || walker.walker_name,
      walker.created_by,
      walker.professional_type === 'hotel' ? 'hotel' : 'walker'
    );
    window.open(link, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {walker.photo_url ? (
              <img src={walker.photo_url} alt={walker.walker_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">🐾</div>
            )}
            <div>
              <p className="text-base">{walker.walker_name || "Sem nome"}</p>
              <p className="text-xs font-normal text-slate-400">{walker.created_by || "—"}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50"
              onClick={() => setShowUpdateRequest(true)}
            >
              <Mail className="w-3.5 h-3.5" /> Pedir Atualizações
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openProfile}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver Perfil
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pausar / Reativar */}
          <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {walker.is_active
                ? <PlayCircle className="w-5 h-5 text-emerald-500" />
                : <PauseCircle className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {walker.is_active ? "Perfil Ativo" : "Perfil Pausado"}
                </p>
                <p className="text-xs text-slate-400">
                  {walker.is_active ? "Aparece nas buscas" : "Invisível para clientes"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleTogglePause}
              disabled={toggling}
              variant={walker.is_active ? "outline" : "default"}
              className={walker.is_active
                ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"}
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> :
                walker.is_active ? "Pausar" : "Reativar"}
            </Button>
          </div>

          {/* Verificação de Dados */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Verificação de Dados</h3>
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full ${vs.bg} ${vs.color} text-xs font-bold`}>
                <VsIcon className="w-3 h-3" /> {vs.label}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <DataRow
                label="Documento de Identidade"
                value={walker.id_document_url ? "Submetido" : "Não submetido"}
                ok={!!walker.id_document_url}
              />
              <DataRow
                label="Comprovativo de Morada"
                value={walker.proof_of_address_url ? "Submetido" : "Não submetido"}
                ok={!!walker.proof_of_address_url}
              />
              {walker.verification_status === "rejected" && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-2">
                  Verificação rejeitada. Contacte o profissional para corrigir documentos.
                </p>
              )}
            </div>
          </div>

          {/* Comissões */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Taxa de Comissão da Plataforma</h3>
              <p className="text-xs text-slate-400 mt-0.5">Define quanto a plataforma retém por transação</p>
            </div>
            <div className="p-4">
              <AdminCommissionManager
                professionalProfile={walker}
                mode={mode}
                setMode={setMode}
                customRate={customRate}
                setCustomRate={setCustomRate}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                zeroMonths={zeroMonths}
                setZeroMonths={setZeroMonths}
                borneBy={borneBy}
                setBorneBy={setBorneBy}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleSaveCommission} disabled={savingCommission} className="gap-2">
            {savingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Comissão
          </Button>
        </DialogFooter>
      </DialogContent>

      {showUpdateRequest && (
        <ProfileUpdateRequestDialog
          isOpen={true}
          onClose={() => setShowUpdateRequest(false)}
          recipientEmail={walker.created_by}
          recipientName={walker.hotel_details?.hotel_name || walker.walker_name}
          profileKind={walker.professional_type === "hotel" ? "hotel" : "walker"}
          profile={walker}
          profileId={walker.id}
          editUrl="/ProfessionalSetup"
        />
      )}
    </Dialog>
  );
}

function DataRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold flex items-center gap-1 ${ok ? "text-emerald-600" : "text-slate-400"}`}>
        {ok && <CheckCircle2 className="w-3.5 h-3.5" />}
        {value}
      </span>
    </div>
  );
}