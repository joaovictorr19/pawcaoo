import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Dog } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ProfileEditRequests() {
  const queryClient = useQueryClient();

  const { data: editRequests = [], isLoading } = useQuery({
    queryKey: ['profileEditRequests'],
    queryFn: () => base44.entities.ProfileEditRequest.filter({ status: 'pending' }, '-created_date'),
    initialData: [],
  });

  const approveEditMutation = useMutation({
    mutationFn: async ({ requestId, profileType, profileId, changes }) => {
      // Apply changes to profile
      if (profileType === 'walker') {
        await base44.entities.WalkerProfile.update(profileId, changes);
      } else if (profileType === 'trainer') {
        await base44.entities.TrainerProfile.update(profileId, changes);
      }

      // Update request status
      await base44.entities.ProfileEditRequest.update(requestId, {
        status: 'approved',
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('✅ Edição aprovada e aplicada!');
    },
  });

  const rejectEditMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.ProfileEditRequest.update(requestId, {
        status: 'rejected',
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      toast.success('Edição rejeitada.');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (editRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido pendente</h3>
          <p className="text-gray-600">Todas as edições de perfis foram revisadas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {editRequests.map((request) => (
        <Card key={request.id} className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {request.profile_type === 'walker' ? <Dog className="w-5 h-5" /> : <User className="w-5 h-5" />}
                <span>{request.requester_name}</span>
                <Badge className="bg-orange-500 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Pendente
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Alterações Solicitadas:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(request.changes_requested, null, 2)}
              </pre>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => approveEditMutation.mutate({
                  requestId: request.id,
                  profileType: request.profile_type,
                  profileId: request.profile_id,
                  changes: request.changes_requested
                })}
                disabled={approveEditMutation.isPending}
                className="flex-1 bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={() => rejectEditMutation.mutate(request.id)}
                disabled={rejectEditMutation.isPending}
                variant="outline"
                className="flex-1 border-red-500 text-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}