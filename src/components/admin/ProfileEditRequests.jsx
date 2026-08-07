import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Eye, ArrowRight, AlertCircle, Clock, SlidersHorizontal, Tag, ListChecks, CreditCard, Inbox } from "lucide-react";
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

const TABS = [
  { value: 'pending', label: 'Pendentes', icon: Clock },
  { value: 'rejected', label: 'Rejeitadas', icon: X },
  { value: 'approved', label: 'Aprovadas', icon: Check },
];

export default function ProfileEditRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['profileEditRequests', activeTab],
    queryFn: async () => {
      const res = await base44.entities.ProfileEditRequest.filter({ status: activeTab }, '-created_date');
      return Array.isArray(res) ? res : [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      if (!request.requested_changes) {
        throw new Error('Nenhuma alteração para aplicar');
      }

      const profileId = request.profile_id || request.walker_id || request.trainer_id;
      if (!profileId) {
        throw new Error('ID do perfil não encontrado');
      }

      // Campos válidos por tipo de entidade — evita erro de validação ao aplicar
      // campos que só existem no WalkerProfile (ex: professional_type, tax_id_*)
      // num entidade TrainerProfile.
      const WALKER_ONLY_FIELDS = new Set([
        'professional_type', 'country_of_operation',
        'tax_id_portugal', 'tax_id_spain', 'tax_id_france',
        'france_professional_type', 'hotel_details',
      ]);

      const changes = { ...request.requested_changes };

      if (request.profile_type === 'trainer' || request.trainer_id) {
        // TrainerProfile não tem campos fiscais/de país — filtrar
        const trainerChanges = Object.fromEntries(
          Object.entries(changes).filter(([key]) => !WALKER_ONLY_FIELDS.has(key))
        );
        await base44.entities.TrainerProfile.update(profileId, {
          ...trainerChanges,
          verification_status: 'verified',
          is_active: true,
        });
      } else {
        // walker e hotel usam WalkerProfile — todos os campos são válidos
        await base44.entities.WalkerProfile.update(profileId, {
          ...changes,
          verification_status: 'verified',
          is_active: true,
        });
      }

      // Marcar pedido como aprovado
      await base44.entities.ProfileEditRequest.update(request.id, {
        status: 'approved',
        admin_notes: 'Aprovado e aplicado',
      });

      // Notificar o profissional (separado para não falhar a mutação)
      try {
        await base44.entities.Notification.create({
          recipient_email: request.professional_email,
          title: 'Alterações Aprovadas',
          message: `As alterações solicitadas no seu perfil foram aprovadas e publicadas.`,
          type: 'system',
          icon: '✅',
        });
      } catch (e) {
        console.warn('Falha ao enviar notificação:', e?.message);
      }
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
      });

      // Notificar o profissional (separado para não falhar a mutação)
      try {
        await base44.entities.Notification.create({
          recipient_email: request.professional_email,
          title: 'Alterações Rejeitadas',
          message: `As alterações solicitadas no seu perfil foram rejeitadas. Entre em contato para mais informações.`,
          type: 'system',
          icon: '❌',
        });
      } catch (e) {
        console.warn('Falha ao enviar notificação:', e?.message);
      }
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

  if (isLoading) return <div className="text-sm text-slate-500 py-4">Carregando solicitações...</div>;

  const formatCurrency = (val) => `€${parseFloat(val || 0).toFixed(2)}`;

  // Compara dados originais com novos — mostra o que foi alterado por escrito
  const renderChangesComparison = (changes, original) => {
    if (!changes) return <p className="text-sm text-slate-400">Sem detalhes disponíveis.</p>;

    const rows = [];

    // Helpers para extrair valores legíveis — inclui campos sensíveis (edições) e de exibição
    const extractItems = (obj) => {
      if (!obj) return [];
      const items = [];
      // Display fields
      if (obj.hourly_rate !== undefined) items.push({ label: 'Tarifa base', value: formatCurrency(obj.hourly_rate) });
      if (obj.bio !== undefined) items.push({ label: 'Descrição', value: obj.bio });
      if (obj.location !== undefined) items.push({ label: 'Localização', value: obj.location });
      if (obj.walker_name !== undefined) items.push({ label: 'Nome', value: obj.walker_name });
      if (obj.phone !== undefined) items.push({ label: 'Telefone', value: obj.phone });
      if (obj.hotel_details?.full_address !== undefined) items.push({ label: 'Morada', value: obj.hotel_details.full_address });
      if (obj.services_offered !== undefined) {
        const names = (obj.services_offered || []).map(s => `${s.service_name || 'Serviço'}: ${formatCurrency(s.price)}`).join(', ');
        items.push({ label: 'Serviços', value: names || '—' });
      }
      // Sensitive fields (documentos/fiscais) — these are what edit requests actually contain
      if (obj.id_document_url !== undefined) items.push({ label: 'Documento ID', value: obj.id_document_url ? 'Enviado' : '—' });
      if (obj.proof_of_address_url !== undefined) items.push({ label: 'Comprovativo Morada', value: obj.proof_of_address_url ? 'Enviado' : '—' });
      if (obj.country_of_operation !== undefined) items.push({ label: 'País de Operação', value: obj.country_of_operation || '—' });
      if (obj.tax_id_portugal !== undefined) items.push({ label: 'NIF (PT)', value: obj.tax_id_portugal || '—' });
      if (obj.tax_id_spain !== undefined) items.push({ label: 'NIF/NIE (ES)', value: obj.tax_id_spain || '—' });
      if (obj.tax_id_france !== undefined) items.push({ label: 'Nº Fiscal (FR)', value: obj.tax_id_france || '—' });
      if (obj.france_professional_type !== undefined) items.push({ label: 'Tipo Prestador (FR)', value: obj.france_professional_type || '—' });
      if (obj.professional_type !== undefined) items.push({ label: 'Tipo Profissional', value: obj.professional_type || '—' });
      return items;
    };

    const newItems = extractItems(changes);
    const oldItems = extractItems(original);

    if (newItems.length === 0) return <p className="text-sm text-slate-400">Sem detalhes disponíveis.</p>;

    return (
      <div className="space-y-2">
        {newItems.map((item, idx) => {
          const oldVal = oldItems.find(o => o.label === item.label)?.value;
          const changed = oldVal !== undefined && oldVal !== item.value;
          return (
            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
              {changed && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 line-through truncate max-w-[40%]">{oldVal}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="font-bold text-slate-900 truncate flex-1">{item.value}</span>
                </div>
              )}
              {!changed && (
                <p className="text-sm font-bold text-slate-900">{item.value}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderChips = (changes) => {
    if (!changes) return [];
    const chips = [];
    if (changes.hourly_rate !== undefined) chips.push('Tarifa base');
    if (changes.services_offered !== undefined) chips.push('Serviços');
    if (changes.bio !== undefined) chips.push('Descrição');
    if (changes.location !== undefined) chips.push('Localização');
    if (changes.walker_name !== undefined) chips.push('Nome');
    if (changes.phone !== undefined) chips.push('Telefone');
    if (changes.hotel_details?.full_address !== undefined) chips.push('Morada');
    if (changes.id_document_url !== undefined) chips.push('Documento ID');
    if (changes.proof_of_address_url !== undefined) chips.push('Comprovativo Morada');
    if (changes.country_of_operation !== undefined) chips.push('País');
    if (changes.tax_id_portugal !== undefined) chips.push('NIF (PT)');
    if (changes.tax_id_spain !== undefined) chips.push('NIF (ES)');
    if (changes.tax_id_france !== undefined) chips.push('Nº Fiscal (FR)');
    if (changes.france_professional_type !== undefined) chips.push('Tipo Prestador');
    if (changes.professional_type !== undefined) chips.push('Tipo Profissional');
    return chips;
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {activeTab === 'pending' && 'Nenhuma alteração pendente.'}
                {activeTab === 'rejected' && 'Nenhuma alteração rejeitada.'}
                {activeTab === 'approved' && 'Nenhuma alteração aprovada.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(request => {
                const changes = request.requested_changes || {};
                const original = request.original_data || {};
                const chips = renderChips(changes);
                const isRejected = request.status === 'rejected';
                const isApproved = request.status === 'approved';

                return (
                  <div key={request.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isRejected && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">Rejeitado</span>}
                        {isApproved && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">Aprovado</span>}
                        {!isRejected && !isApproved && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9E6] text-[#B8860B]">Pendente</span>}
                        <h4 className="font-bold text-slate-900 text-sm">{request.professional_name || request.walker_name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#1D8A82] capitalize">{request.profile_type || 'walker'}</span>
                      </div>
                      <p className="text-xs text-slate-400">Solicitado em {new Date(request.created_date).toLocaleDateString()}</p>
                    </div>
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {chips.map((chip, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#1D8A82]">{chip}</span>
                        ))}
                      </div>
                    )}
                    {request.admin_notes && (
                      <p className="text-xs text-slate-500 mb-3 italic">Notas: {request.admin_notes}</p>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)} className="border-[#1D8A82] text-[#1D8A82] hover:bg-teal-50">
                          <Eye className="w-4 h-4 mr-2" /> Rever Detalhes
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
                          <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Alterações Solicitadas</h5>
                          {renderChangesComparison(request.requested_changes, request.original_data)}
                        </div>

                        {request.status === 'pending' && (
                          <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => rejectMutation.mutate(request)}
                              disabled={rejectMutation.isPending}
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="w-4 h-4 mr-2" /> Recusar
                            </Button>
                            <Button
                              onClick={() => approveMutation.mutate(request)}
                              disabled={approveMutation.isPending}
                              className="flex-1 bg-gradient-to-r from-[#1D8A82] to-[#2DB0A6] hover:opacity-90 text-white border-0"
                            >
                              <Check className="w-4 h-4 mr-2" /> Aceitar e Publicar
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}