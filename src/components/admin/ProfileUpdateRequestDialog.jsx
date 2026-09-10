import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getProfileCompleteness } from "@/lib/profileCompleteness";

export default function ProfileUpdateRequestDialog({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  profileKind,
  profile,
  profileId,
  editUrl,
}) {
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const { missingItems, percentage } = useMemo(
    () => getProfileCompleteness(profile, profileKind),
    [profile, profileKind]
  );

  // Pré-seleciona todos os itens em falta quando o perfil muda
  useEffect(() => {
    setSelected(missingItems.map((i) => i.key));
  }, [missingItems]);

  const toggle = (key) =>
    setSelected((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const selectedItems = missingItems.filter((i) => selected.includes(i.key));

  const handleSend = async () => {
    if (!recipientEmail || selectedItems.length === 0) return;
    setSending(true);
    try {
      const fullEditUrl = editUrl ? `${window.location.origin}${editUrl}` : undefined;
      await base44.functions.invoke("sendProfileUpdateRequest", {
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        profile_type: profileKind === "client" ? "client" : "professional",
        profile_kind: profileKind,
        profile_id: profileId,
        selected_items: selectedItems.map((i) => ({
          key: i.key,
          label: i.label,
          description: i.description,
          icon: i.icon,
        })),
        custom_note: note.trim() || undefined,
        edit_url: fullEditUrl,
      });
      toast.success(`Email enviado para ${recipientEmail}`);
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Erro ao enviar email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-teal-600" />
            Pedir Atualizações
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Envia um email profissional a {recipientName || recipientEmail} com as secções a atualizar.
          </p>
        </DialogHeader>

        {profile == null ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : missingItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-bold text-slate-800">Perfil 100% completo!</p>
            <p className="text-xs text-slate-500">Não há secções em falta para pedir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Completude do perfil</span>
                <span className="font-black text-teal-700">{percentage}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${percentage}%`, background: percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444" }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {missingItems.length} secção(ões) em falta. Selecione as que pretende pedir.
              </p>
            </div>

            <div className="space-y-2">
              {missingItems.map((item) => {
                const sel = selected.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggle(item.key)}
                    className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      sel ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl leading-none mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        sel ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {sel && <CheckCircle2 className="w-4 h-4" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Nota personalizada (opcional)</label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: por favor complete estes dados para concluirmos a verificação do seu perfil."
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || selectedItems.length === 0} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}