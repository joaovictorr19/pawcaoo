import React, { useState } from "react";
import { ShieldCheck, XCircle, ClipboardCheck, Copy, ExternalLink, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const TONES = {
  neutral: "border-slate-200 text-slate-700 hover:bg-slate-50",
  success: "border-teal-200 text-teal-700 hover:bg-teal-50",
  danger: "border-red-200 text-red-600 hover:bg-red-50",
};

function Action({ icon: Icon, label, onClick, disabled, tone = "neutral", active, activeLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "w-full flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed " +
        (active ? "border-teal-500 bg-teal-50 text-teal-700" : TONES[tone])
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{active && activeLabel ? activeLabel : label}</span>
    </button>
  );
}

export default function AccountQuickActions({
  email,
  userId,
  isProfessional,
  verificationStatus,
  onVerify,
  onReject,
  onRequestUpdates,
  onOpenProfile,
  saving,
}) {
  const [copied, setCopied] = useState(null);

  const copy = (value, key, message) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(key);
    toast.success(message);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 pb-1">Ações rápidas</p>

      {isProfessional && (
        <>
          <Action
            icon={saving ? Loader2 : ShieldCheck}
            label="Marcar como verificado"
            activeLabel="A verificar..."
            active={saving}
            tone="success"
            disabled={saving || verificationStatus === "verified"}
            onClick={onVerify}
          />
          <Action
            icon={XCircle}
            label="Rejeitar verificação"
            tone="danger"
            disabled={saving}
            onClick={onReject}
          />
        </>
      )}

      <Action icon={ClipboardCheck} label="Pedir atualizações" onClick={onRequestUpdates} />
      <Action icon={ExternalLink} label="Ver perfil público" onClick={onOpenProfile} />

      <div className="h-px bg-slate-100 my-1.5" />

      <Action
        icon={copied === "email" ? Check : Copy}
        label="Copiar email"
        onClick={() => copy(email, "email", "Email copiado.")}
      />
      <Action
        icon={copied === "id" ? Check : Copy}
        label="Copiar ID"
        onClick={() => copy(userId, "id", "ID copiado.")}
      />
    </div>
  );
}