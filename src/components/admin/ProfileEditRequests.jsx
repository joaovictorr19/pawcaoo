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
      // Apply changes to profile - keep existing verification status
      if (profileType === 'walker') {
        await base44.entities.WalkerProfile.update(profileId, changes);
      } else if (profileType === 'trainer') {
        await base44.entities.TrainerProfile.update(profileId, changes);
      }

      // Mark request as approved
      await base44.entities.ProfileEditRequest.update(requestId, {
        status: 'approved',
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['allTrainersAdmin'] });
      toast.success('✅ Alterações aprovadas e publicadas!');
    },
  });

  const rejectEditMutation = useMutation({
    mutationFn: async (requestId) => {
      // Delete the request - reject means discard draft
      await base44.entities.ProfileEditRequest.delete(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      toast.success('✅ Edição rejeitada e rascunho apagado.');
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
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 space-y-3 max-h-96 overflow-auto">
                {Object.entries(request.changes_requested).map(([key, value]) => (
                  <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs font-bold text-purple-600 uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                    <div className="text-sm text-gray-800">
                      {typeof value === 'object' ? (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p className="font-semibold">{value?.toString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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