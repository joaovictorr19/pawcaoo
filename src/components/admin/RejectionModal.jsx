import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Modal de rejeição com textarea ampla.
 * Funciona para rejeição individual (targetCount=1) ou em massa (targetCount>1).
 * O motivo é obrigatório — o botão de confirmação fica desativado até preencher.
 */
export default function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  targetCount = 1,
  targetLabel,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const isBulk = targetCount > 1;
  const canSubmit = reason.trim().length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="max-w-md gap-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </span>
            {isBulk ? `Rejeitar ${targetCount} candidaturas` : "Rejeitar candidatura"}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? `A mesma justificação será aplicada aos ${targetCount} candidatos selecionados.`
              : targetLabel
                ? `Candidato: ${targetLabel}`
                : "Indique o motivo da rejeição. O motivo ficará visível para o candidato."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="rejection-reason" className="text-sm font-semibold text-slate-700">
            Motivo da rejeição <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Documentos ilegíveis, experiência insuficiente, informação incompleta..."
            className="min-h-[120px] resize-none bg-white"
            autoFocus
            disabled={isLoading}
          />
          {reason.trim().length === 0 && (
            <p className="text-xs text-slate-400">O motivo é obrigatório para submeter.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A rejeitar...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Confirmar Rejeição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}