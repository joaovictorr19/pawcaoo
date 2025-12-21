import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Eye, ArrowRight, AlertCircle, Clock } from "lucide-react";
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
      // 1. Update the WalkerProfile with the requested changes
      if (request.requested_changes) {
        await base44.entities.WalkerProfile.update(request.walker_id, request.requested_changes);
      }
      // 2. Mark request as approved
      await base44.entities.ProfileEditRequest.update(request.id, { 
        status: 'approved',
        admin_notes: 'Aprovado pelo administrador'
      });
    },
    onSuccess: () => {
      toast.success("Alterações aprovadas e aplicadas!");
      queryClient.invalidateQueries(['profileEditRequests']);
      setSelectedRequest(null);
    },
    onError: () => toast.error("Erro ao aprovar alterações.")
  });

  const rejectMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.ProfileEditRequest.update(request.id, { 
        status: 'rejected',
        admin_notes: 'Rejeitado pelo administrador'
      });
    },
    onSuccess: () => {
      toast.success("Alterações rejeitadas.");
      queryClient.invalidateQueries(['profileEditRequests']);
      setSelectedRequest(null);
    },
    onError: () => toast.error("Erro ao rejeitar.")
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
    return (
      <div className="space-y-4">
        {changes.hourly_rate && (
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="font-medium">Preço Base:</span>
            <span className="text-green-600 font-bold">{formatCurrency(changes.hourly_rate)}</span>
          </div>
        )}
        {changes.services_offered && (
          <div className="space-y-2">
            <span className="font-medium block mb-1">Serviços:</span>
            {changes.services_offered.map((s, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>{s.service_name}</span>
                  <span>{formatCurrency(s.price)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        )}
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
                <h4 className="font-bold text-gray-900">{request.walker_name}</h4>
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Rever Alterações</DialogTitle>
                  <DialogDescription>
                    O profissional solicitou as seguintes mudanças no perfil.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Novos Dados</h5>
                  {renderChanges(request.requested_changes)}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="destructive" 
                    onClick={() => rejectMutation.mutate(request)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => approveMutation.mutate(request)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar e Publicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}