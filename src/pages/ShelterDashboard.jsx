import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeIcon, Plus, Trash2, AlertCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ShelterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddNeed, setShowAddNeed] = useState(false);
  const [newNeed, setNewNeed] = useState({
    item_name: "",
    quantity_needed: "",
    unit: "",
    urgency: "medium",
    description: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myShelter, isLoading } = useQuery({
    queryKey: ['myShelter', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const shelters = await base44.entities.ShelterProfile.filter({ created_by: user.email });
      return shelters[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myNeeds = [] } = useQuery({
    queryKey: ['myNeeds', myShelter?.id],
    queryFn: async () => {
      if (!myShelter?.id) return [];
      return await base44.entities.ShelterNeed.filter({ shelter_id: myShelter.id }, '-created_date');
    },
    enabled: !!myShelter?.id,
  });

  const addNeedMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ShelterNeed.create({
        ...data,
        shelter_id: myShelter.id,
        quantity_needed: parseFloat(data.quantity_needed)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNeeds']);
      setShowAddNeed(false);
      setNewNeed({ item_name: "", quantity_needed: "", unit: "", urgency: "medium", description: "" });
      toast.success('Necessidade adicionada!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const deleteNeedMutation = useMutation({
    mutationFn: async (needId) => {
      return await base44.entities.ShelterNeed.delete(needId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNeeds']);
      toast.success('Necessidade removida');
    }
  });

  const handleAddNeed = (e) => {
    e.preventDefault();
    addNeedMutation.mutate(newNeed);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Necessário</h2>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <p className="text-gray-600">A carregar...</p>
      </div>
    );
  }

  if (!myShelter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sem abrigo registado</h2>
            <p className="text-gray-600 mb-6">Ainda não tem um abrigo registado.</p>
            <Button onClick={() => navigate(createPageUrl('ShelterRegister'))} className="bg-green-600">
              Registar Abrigo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (myShelter.verification_status === 'approved' || myShelter.is_verified) {
      return <Badge className="bg-green-500">Aprovado</Badge>;
    }
    if (myShelter.verification_status === 'rejected') {
      return <Badge className="bg-red-500">Rejeitado</Badge>;
    }
    return <Badge className="bg-yellow-500">Pendente de Aprovação</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{myShelter.shelter_name}</h1>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl(`ShelterProfile?id=${myShelter.id}`))}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Perfil Público
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-xl mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Necessidades do Abrigo</CardTitle>
            <Dialog open={showAddNeed} onOpenChange={setShowAddNeed}>
              <DialogTrigger asChild>
                <Button className="bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Necessidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Necessidade</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddNeed} className="space-y-4">
                  <div>
                    <Label>Item Necessário *</Label>
                    <Input
                      value={newNeed.item_name}
                      onChange={(e) => setNewNeed({...newNeed, item_name: e.target.value})}
                      required
                      placeholder="Ex: Ração para cães"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        value={newNeed.quantity_needed}
                        onChange={(e) => setNewNeed({...newNeed, quantity_needed: e.target.value})}
                        required
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label>Unidade</Label>
                      <Input
                        value={newNeed.unit}
                        onChange={(e) => setNewNeed({...newNeed, unit: e.target.value})}
                        placeholder="kg, unidades, litros"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Urgência *</Label>
                    <Select value={newNeed.urgency} onValueChange={(val) => setNewNeed({...newNeed, urgency: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newNeed.description}
                      onChange={(e) => setNewNeed({...newNeed, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={addNeedMutation.isPending} className="w-full">
                    {addNeedMutation.isPending ? 'A adicionar...' : 'Adicionar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {myNeeds.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Ainda não tem necessidades registadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myNeeds.map((need) => (
                  <div key={need.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{need.item_name}</h4>
                      <p className="text-sm text-gray-600">
                        {need.quantity_needed} {need.unit || 'unidades'}
                      </p>
                      {need.description && <p className="text-sm text-gray-500 mt-1">{need.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        need.urgency === 'critical' ? 'bg-red-600' :
                        need.urgency === 'high' ? 'bg-orange-500' :
                        need.urgency === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }>
                        {need.urgency}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNeedMutation.mutate(need.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}