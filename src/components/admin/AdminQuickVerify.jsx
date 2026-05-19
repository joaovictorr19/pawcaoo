import React, { useState } from "react";
import { Check, X, Eye, FileText, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function AdminQuickVerify({ userProfile, walkerData }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const wd = walkerData || {};

  // Mutação Única para Aprovar e Ativar no PawGo
  const verifyMutation = useMutation({
    mutationFn: async (status) => {
      const canBeVisible = Boolean(
        wd?.walker_name &&
        wd?.location &&
        wd?.whatsapp_number &&
        Number(wd?.hourly_rate || 0) > 0
      );
      const finalStatus = status === 'verified' && canBeVisible ? 'verified' : (status === 'verified' ? 'pending' : status);

      // 1. Atualiza o Perfil de Walker
      if (wd && wd.id) {
        await base44.entities.WalkerProfile.update(wd.id, {
          verification_status: finalStatus,
          is_active: finalStatus === 'verified',
          has_pawcao_seal: finalStatus === 'verified' // Dá o selo automaticamente
        });
      }

      // 2. Atualiza o Usuário Global (Unificação)
      if (userProfile && userProfile.id) {
        await base44.entities.User.update(userProfile.id, {
          is_verified: finalStatus === 'verified',
          professional_profile: {
            ...(userProfile.professional_profile || {}),
            verification_status: finalStatus,
            is_verified: finalStatus === 'verified',
            is_active: finalStatus === 'verified'
          }
        });
      }

      // TrainerProfile sync
      if (userProfile?.email) {
        const trainers = await base44.entities.TrainerProfile.filter({ created_by: userProfile.email });
        if (Array.isArray(trainers) && trainers.length > 0) {
          await base44.entities.TrainerProfile.update(trainers[0].id, {
            verification_status: finalStatus,
            is_active: finalStatus === 'verified'
          });
        }

        // UserProfile flag sync
        const profiles = await base44.entities.UserProfile.filter({ user_email: userProfile.email });
        if (Array.isArray(profiles) && profiles.length > 0) {
          await base44.entities.UserProfile.update(profiles[0].id, {
            is_verified: finalStatus === 'verified',
            pawcao_seal: finalStatus === 'verified'
          });
        } else {
          await base44.entities.UserProfile.create({
            user_email: userProfile.email,
            user_id: userProfile.id,
            full_name: userProfile.full_name || 'Utilizador',
            is_verified: finalStatus === 'verified',
            pawcao_seal: finalStatus === 'verified'
          });
        }
      }
    },
    onSuccess: async (_, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allUsers'] }),
        queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] }),
        queryClient.invalidateQueries({ queryKey: ['allWalkers'] }),
        queryClient.invalidateQueries({ queryKey: ['featuredWalkers'] }),
        queryClient.invalidateQueries({ queryKey: ['myProfessionalProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['existingProfessionalProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['myWalkerProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['myTrainerProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
        queryClient.invalidateQueries({ queryKey: ['currentUserProfileXP'] })
      ]);
      toast.success(
        status === 'verified'
          ? (wd?.walker_name && wd?.location && wd?.whatsapp_number && Number(wd?.hourly_rate || 0) > 0
              ? "Profissional aprovado e visível na Home!"
              : "Perfil incompleto: ficou pendente e não aprovado até poder aparecer na Home.")
          : "Candidatura Rejeitada."
      );
      setIsOpen(false);
    }
  });



  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="h-8 gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      >
        <Eye className="w-4 h-4" /> Validar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="text-green-400" /> 
                Verificação: {walkerData?.walker_name || userProfile?.full_name || userProfile?.email || 'Utilizador'}
              </DialogTitle>
              <Badge variant="outline" className="text-white border-white/20">
                ID: {wd.id ? wd.id.slice(0,8) : 'N/A'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-6 grid md:grid-cols-2 gap-6 bg-gray-50 max-h-[60vh] overflow-y-auto">
            {/* Lado Esquerdo: Documento */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-gray-500">Documento de Identificação</Label>
              <div className="aspect-[4/3] bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group cursor-zoom-in">
                {wd.id_document_url ? (
                  <img 
                    src={wd.id_document_url} 
                    alt="ID Document" 
                    className="w-full h-full object-contain transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Nenhum documento anexado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lado Direito: Info de Cadastro */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-bold text-sm mb-3 border-b pb-2">Dados Fiscais (NIF)</h4>
                <p className="text-lg font-mono text-blue-700">{wd.tax_id_portugal || "Não informado"}</p>
                <p className="text-xs text-gray-500 mt-1">País: {wd.country_of_operation}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="font-bold text-sm mb-3 border-b pb-2">Resumo Profissional</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Experiência:</strong> {wd.experience_years} anos</p>
                  <p><strong>Taxa Horária:</strong> {wd.hourly_rate}€</p>
                  <p><strong>WhatsApp:</strong> {wd.whatsapp_number}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              variant="ghost" 
              className="text-red-600 hover:bg-red-50"
              onClick={() => verifyMutation.mutate('rejected')}
              disabled={verifyMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" /> Rejeitar
            </Button>
            
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => verifyMutation.mutate('verified')}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Aprovar e Ativar PawGo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}