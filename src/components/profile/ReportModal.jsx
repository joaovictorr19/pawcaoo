import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const REASONS = [
  { value: "inappropriate_content", label: "Conteúdo inapropriado" },
  { value: "fake_profile", label: "Perfil falso" },
  { value: "harassment", label: "Assédio" },
  { value: "spam", label: "Spam" },
  { value: "animal_safety", label: "Segurança animal" },
  { value: "other", label: "Outro" },
];

export default function ReportModal({ open, onOpenChange, reportedUser, reporterEmail, reporterName }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserReport.create({
        reporter_email: reporterEmail,
        reporter_name: reporterName,
        reported_user_email: reportedUser?.email || reportedUser?.user_email,
        reported_user_name: reportedUser?.full_name || reportedUser?.walker_name || reportedUser?.username,
        reason,
        description,
      });
    },
    onSuccess: () => {
      toast.success("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
      setReason("");
      setDescription("");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao enviar denúncia. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Selecione um motivo");
      return;
    }
    reportMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Flag className="w-5 h-5 text-rose-500" />
            Denunciar Utilizador
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    reason === r.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-desc">Descrição (opcional)</Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes sobre a denúncia..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reportMutation.isPending || !reason}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                A enviar...
              </>
            ) : (
              "Enviar Denúncia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}