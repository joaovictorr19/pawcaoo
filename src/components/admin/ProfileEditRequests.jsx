import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Eye, ArrowRight, AlertCircle, Clock, SlidersHorizontal, Tag, ListChecks, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

export default function ProfileEditRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['profileEditRequests'],
    queryFn: async () => {
      const res = await base44.entities.ProfileEditRequest.filter({ status: 'pending' }, '-created_date');
      return Array.isArray(res) ? res : [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      if (!request.requested_changes) {
        throw new Error('Nenhuma alteração para aplicar');
      }

      // Aplicar mudanças APENAS ao perfil existente (NÃO criar novo)
      const profileId = request.profile_id || request.walker_id || request.trainer_id;
      
      if (!profileId) {
        throw new Error('ID do perfil não encontrado');
      }

      if (request.profile_type === 'hotel') {
        // Hotel: atualizar WalkerProfile com hotel_details
        await base44.entities.WalkerProfile.update(profileId, {
          ...request.requested_changes,
          verification_status: 'verified',
          is_active: true,
        });
      } else if (request.profile_type === 'walker' || request.walker_id) {
        await base44.entities.WalkerProfile.update(profileId, {
          ...request.requested_changes,
          verification_status: 'verified',
          is_active: true,
        });
      } else if (request.profile_type === 'trainer' || request.trainer_id) {
        await base44.entities.TrainerProfile.update(profileId, {
          ...request.requested_changes,
          verification_status: 'verified',
          is_active: true,
        });
      } else {
        // Fallback: tentar WalkerProfile
        await base44.entities.WalkerProfile.update(profileId, {
          ...request.requested_changes,
          verification_status: 'verified',
          is_active: true,
        });
      }

      // Marcar pedido como aprovado
      await base44.entities.ProfileEditRequest.update(request.id, { 
        status: 'approved',
        admin_notes: 'Aprovado e aplicado',
        approved_date: new Date().toISOString()
      });

      // Notificar o profissional
      await base44.entities.Notification.create({
        recipient_email: request.professional_email,
        title: 'Alterações Aprovadas',
        message: `As alterações solicitadas no seu perfil foram aprovadas e publicadas.`,
        type: 'system',
        priority: 'normal'
      });
    },
    onSuccess: () => {
      toast.success("Alterações aprovadas e aplicadas ao perfil existente!");
      queryClient.invalidateQueries(['profileEditRequests']);
      queryClient.invalidateQueries(['allWalkersAdmin']);
      queryClient.invalidateQueries(['allTrainersAdmin']);
      queryClient.invalidateQueries(['walkers']);
      queryClient.invalidateQueries(['trainers']);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("Erro ao aprovar: " + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.ProfileEditRequest.update(request.id, { 
        status: 'rejected',
        admin_notes: 'Rejeitado pelo administrador',
        rejected_date: new Date().toISOString()
      });

      // Notificar o profissional
      await base44.entities.Notification.create({
        recipient_email: request.professional_email,
        title: 'Alterações Rejeitadas',
        message: `As alterações solicitadas no seu perfil foram rejeitadas. Entre em contato para mais informações.`,
        type: 'system',
        priority: 'normal'
      });
    },
    onSuccess: () => {
      toast.success("Alterações rejeitadas.");
      queryClient.invalidateQueries(['profileEditRequests']);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar: " + error.message);
    }
  });

  if (isLoading) return <div>Carregando solicitações...</div>;

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <Check className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Nenhuma alteração pendente.</p>
      </div>
    );
  }

  const formatCurrency = (val) => `€${parseFloat(val).toFixed(2)}`;

  const renderChanges = (changes) => {
    if (!changes) return null;
    const items = [];
    if (changes.hourly_rate) {
      items.push({
        icon: CreditCard,
        label: 'Tarifa base',
        value: formatCurrency(changes.hourly_rate),
      });
    }
    if (changes.services_offered) {
      changes.services_offered.forEach((s) => {
        items.push({
          icon: SlidersHorizontal,
          label: s.service_name || 'Serviço',
          value: formatCurrency(s.price),
          sub: s.description,
        });
      });
    }
    if (changes.bio) {
      items.push({ icon: ListChecks, label: 'Descrição', value: changes.bio });
    }
    if (changes.location) {
      items.push({ icon: Tag, label: 'Localização', value: changes.location });
    }
    if (items.length === 0) return <p className="text-sm text-slate-400">Sem detalhes disponíveis.</p>;
    return (
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>
                {item.sub && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid gap-4">
      {requests.map(request => (
        <Card key={request.id} className="border border-yellow-200 bg-yellow-50/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Clock className="w-3 h-3 mr-1" /> Pendente
                </Badge>
                <h4 className="font-bold text-gray-900">{request.professional_name || request.walker_name}</h4>
                <Badge className="text-xs capitalize">
                  {request.profile_type || 'walker'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Solicitado em {new Date(request.created_date).toLocaleDateString()}
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                  <Eye className="w-4 h-4 mr-2" /> Rever
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl" style={{ borderRadius: '1.5rem' }}>
                <div className="bg-gradient-to-r from-[#1D8A82] to-[#2DB0A6] px-6 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-lg font-extrabold leading-tight">Rever Alterações</DialogTitle>
                    <p className="text-white/80 text-xs mt-0.5">{request.professional_name || request.walker_name}</p>
                  </div>
                </div>

                <div className="px-6 pt-5 pb-4">
                  <p className="text-sm text-slate-500 mb-4">O profissional solicitou as seguintes mudanças no perfil.</p>
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Novos Dados</h5>
                  {renderChanges(request.requested_changes)}
                </div>

                <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => rejectMutation.mutate(request)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate(request)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#1D8A82] to-[#2DB0A6] hover:opacity-90 text-white border-0"
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar e Publicar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}