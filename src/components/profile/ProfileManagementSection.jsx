import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PauseCircle, PlayCircle, ShieldCheck, BadgePercent, FileText,
  Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, XCircle
} from "lucide-react";
import ProfileSection from "@/components/profile/ProfileSection";

const VERIFICATION_LABELS = {
  requires_documents: { label: "Documentos necessários", color: "text-amber-500", bg: "bg-amber-50", icon: AlertTriangle },
  pending:            { label: "Em verificação",          color: "text-blue-500",   bg: "bg-blue-50",   icon: Clock },
  verified:           { label: "Verificado",               color: "text-emerald-600",bg: "bg-emerald-50",icon: CheckCircle2 },
  rejected:           { label: "Rejeitado",                color: "text-red-500",    bg: "bg-red-50",    icon: XCircle },
};

const COMMISSION_LABELS = {
  default:         "Padrão da Plataforma",
  custom_percent:  "Percentual Personalizado",
  zero:            "Isento (Permanente)",
  zero_temporary:  "Isento (Temporário)",
};

export default function ProfileManagementSection({
  walkerProfile,
  trainerProfile,
  currentUser,
  isOwnProfile,
  profileEmail,
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null); // "verify" | "commission" | null
  const [toggling, setToggling] = useState(false);

  const profile = walkerProfile || trainerProfile;
  const profileType = walkerProfile ? "walker" : "trainer";
  const isAdmin = currentUser?.role === "admin";
  const canManage = isOwnProfile || isAdmin;

  // Only show for professionals (not hotels) who can manage
  if (!profile || !canManage || walkerProfile?.professional_type === "hotel") return null;

  const handleTogglePause = async () => {
    setToggling(true);
    try {
      const entity = profileType === "walker"
        ? base44.entities.WalkerProfile
        : base44.entities.TrainerProfile;
      await entity.update(profile.id, { is_active: !profile.is_active });
      queryClient.invalidateQueries({ queryKey: ["walkerProfile", profileEmail, undefined] });
      queryClient.invalidateQueries({ queryKey: ["trainerProfile", profileEmail] });
      queryClient.invalidateQueries({ queryKey: ["allWalkers"] });
      toast.success(profile.is_active ? "Perfil pausado — não aparece em buscas." : "Perfil reativado!");
    } catch (e) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setToggling(false);
    }
  };

  const vs = VERIFICATION_LABELS[profile.verification_status] || VERIFICATION_LABELS.requires_documents;
  const VsIcon = vs.icon;

  const commissionMode = profile.commission_rate_mode || "default";
  const customRate = profile.custom_commission_rate;
  const commissionExpiry = profile.commission_rate_expiry;
  const commissionBorneBy = profile.commission_borne_by || "hotel";
  const exempt = profile.exempt_from_platform_fees;

  return (
    <ProfileSection delay={0.15}>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-800">Gestão do Perfil</h3>
          <span className="ml-auto text-[10px] font-medium text-slate-400 uppercase tracking-wide">
            {profileType === "walker" ? "Dog Walker/Treinador" : "Treinador"}
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {/* ─── Pausar / Reativar ─── */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile.is_active
                ? <PlayCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                : <PauseCircle className="w-4 h-4 text-amber-500 shrink-0" />}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  {profile.is_active ? "Perfil Ativo" : "Perfil Pausado"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {profile.is_active ? "Aparece nas buscas" : "Invisível para clientes"}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePause}
              disabled={toggling}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50 ${
                profile.is_active
                  ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {toggling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : profile.is_active ? "Pausar" : "Reativar"}
            </button>
          </div>

          {/* ─── Verificação de Dados ─── */}
          <button
            onClick={() => setExpanded(expanded === "verify" ? null : "verify")}
            className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">Verificação de Dados</p>
                <p className="text-[10px] text-slate-400">Documentos e estado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${vs.bg} ${vs.color} text-[10px] font-bold`}>
                <VsIcon className="w-3 h-3" /> {vs.label}
              </span>
              {expanded === "verify"
                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </button>
          <AnimatePresence>
            {expanded === "verify" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-2 bg-slate-50/50">
                  {profile.id_document_url && (
                    <DataRow label="Documento de Identidade" value="Submetido" ok />
                  )}
                  {profile.proof_of_address_url && (
                    <DataRow label="Comprovativo de Morada" value="Submetido" ok />
                  )}
                  {!profile.id_document_url && !profile.proof_of_address_url && (
                    <p className="text-[11px] text-slate-400 py-2">
                      Nenhum documento submetido. Aceda ao painel profissional para enviar.
                    </p>
                  )}
                  {profile.verification_status === "rejected" && (
                    <p className="text-[11px] text-red-500 bg-red-50 rounded-lg px-2 py-1.5">
                      Verificação rejeitada. Verifique os documentos no painel profissional.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Comissões ─── */}
          <button
            onClick={() => setExpanded(expanded === "commission" ? null : "commission")}
            className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BadgePercent className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">Comissões</p>
                <p className="text-[10px] text-slate-400">Taxas da plataforma</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500">
                {exempt ? "Isento" : commissionMode === "custom_percent" ? `${customRate}%` : COMMISSION_LABELS[commissionMode]}
              </span>
              {expanded === "commission"
                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </button>
          <AnimatePresence>
            {expanded === "commission" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-2 bg-slate-50/50">
                  <DataRow label="Modo de Comissão" value={COMMISSION_LABELS[commissionMode] || commissionMode} />
                  {commissionMode === "custom_percent" && (
                    <DataRow label="Percentual Personalizado" value={`${customRate}%`} />
                  )}
                  {commissionMode === "zero_temporary" && commissionExpiry && (
                    <DataRow label="Expira em" value={new Date(commissionExpiry + "T12:00:00").toLocaleDateString("pt-PT")} />
                  )}
                  {profileType === "walker" && (
                    <DataRow
                      label="Pago por"
                      value={commissionBorneBy === "hotel" ? "Hotel (do valor do serviço)" : "Cliente (acrescido ao preço)"}
                    />
                  )}
                  {exempt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Profissional isento de taxas
                    </div>
                  )}
                  {!isAdmin && (
                    <p className="text-[10px] text-slate-400 pt-1">
                      Para alterar comissões, contacte o suporte PawCão.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProfileSection>
  );
}

function DataRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-semibold ${ok ? "text-emerald-600" : "text-slate-700"}`}>
        {ok && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
        {value}
      </span>
    </div>
  );
}