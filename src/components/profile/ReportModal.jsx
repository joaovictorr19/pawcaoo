import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2, AlertCircle, UserX, ShieldAlert, Ban, PawPrint, MoreHorizontal, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const REASONS = [
  { value: "inappropriate_content", label: "Conteúdo inapropriado", icon: AlertCircle },
  { value: "fake_profile", label: "Perfil falso", icon: UserX },
  { value: "harassment", label: "Assédio", icon: ShieldAlert },
  { value: "spam", label: "Spam", icon: Ban },
  { value: "animal_safety", label: "Segurança animal", icon: PawPrint },
  { value: "other", label: "Outro", icon: MoreHorizontal },
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
      <DialogContent className="max-w-md bg-[#F4F7FB] border-0 p-0 overflow-hidden rounded-3xl">
        <div className="bg-white m-3 rounded-2xl p-6 space-y-5">
          <DialogHeader className="space-y-0">
            <DialogTitle className="flex items-center gap-2 text-[#1A202C] text-lg font-bold p-0">
              <Flag className="w-5 h-5 text-rose-500" />
              Denunciar Utilizador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-[#1A202C] font-bold text-sm">
              Motivo <span className="text-[#718096]">*</span>
            </Label>
            <div className="space-y-2">
              {REASONS.map((r) => {
                const Icon = r.icon;
                const isSelected = reason === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? "bg-[#E0F2FE] border-[#BBE1FA] text-[#1A202C]"
                        : "bg-white border-[#CBD5E0] text-[#1A202C] hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-[#BBE1FA]" : "bg-slate-100"
                    }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[#1A202C]" : "text-[#718096]"}`} />
                    </div>
                    <span className="flex-1">{r.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#1A202C] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-desc" className="text-[#1A202C] font-bold text-sm">
              Descrição (opcional)
            </Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes sobre a denúncia..."
              rows={4}
              className="resize-none bg-white border-[#CBD5E0] text-[#1A202C] placeholder:text-[#718096] rounded-xl"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white border-[#CBD5E0] text-[#1A202C] hover:bg-slate-50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reportMutation.isPending || !reason}
              className="flex-1 bg-[#E0F2FE] border border-[#BBE1FA] text-[#1A202C] hover:bg-[#BAE6FD] rounded-xl"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}