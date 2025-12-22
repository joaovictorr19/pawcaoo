import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Edit, Trash2, Eye, Plus, ArrowLeft, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";

export default function ManageMyAdoptions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  
  const [selectedListing, setSelectedListing] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myListings = [], isLoading } = useQuery({
    queryKey: ['myAdoptionListings', user?.email],
    queryFn: () => base44.entities.AdoptionListing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['listingApplications'],
    queryFn: async () => {
      const myListingIds = myListings.map(l => l.id);
      if (myListingIds.length === 0) return [];
      const allApps = await base44.entities.AdoptionApplication.list('-created_date', 200);
      return allApps.filter(app => myListingIds.includes(app.listing_id));
    },
    enabled: myListings.length > 0,
    initialData: [],
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdoptionListing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAdoptionListings'] });
      queryClient.invalidateQueries({ queryKey: ['adoptionListings'] });
      toast.success("Anúncio atualizado!");
      setShowEditDialog(false);
    },
    onError: () => toast.error("Erro ao atualizar anúncio"),
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id) => base44.entities.AdoptionListing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAdoptionListings'] });
      queryClient.invalidateQueries({ queryKey: ['adoptionListings'] });
      toast.success("Anúncio eliminado!");
    },
    onError: () => toast.error("Erro ao eliminar anúncio"),
  });

  const handleEdit = (listing) => {
    setSelectedListing(listing);
    setEditForm({
      status: listing.status,
      urgency_level: listing.urgency_level,
      description: listing.description,
      adoption_fee: listing.adoption_fee,
      contact_phone: listing.contact_phone,
      contact_whatsapp: listing.contact_whatsapp,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateListingMutation.mutate({
      id: selectedListing.id,
      data: editForm
    });
  };

  const handleMarkAdopted = (listing) => {
    if (confirm(`Marcar ${listing.pet_name} como adotado?`)) {
      updateListingMutation.mutate({
        id: listing.id,
        data: {
          status: 'adopted',
          adopted_date: new Date().toISOString()
        }
      });
    }
  };

  const handleDelete = (listing) => {
    if (confirm(`Eliminar anúncio de ${listing.pet_name}? Esta ação não pode ser desfeita.`)) {
      deleteListingMutation.mutate(listing.id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Necessário</h2>
            <p className="text-gray-600 mb-6">Faça login para gerir os seus anúncios de adoção</p>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => navigate(createPageUrl('AdoptionListings'))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Meus Anúncios de Adoção
            </h1>
            <p className="text-gray-600">
              {myListings.length} anúncios • {applications.length} candidaturas recebidas
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
            className="bg-gradient-to-r from-pink-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Anúncio
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Heart className="w-20 h-20 text-pink-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nenhum anúncio criado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece a ajudar pets a encontrar um lar
              </p>
              <Button
                onClick={() => navigate(createPageUrl('CreateAdoptionListing'))}
                className="bg-gradient-to-r from-pink-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Anúncio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myListings.map(listing => {
              const listingApps = applications.filter(app => app.listing_id === listing.id);
              
              return (
                <Card key={listing.id} className="border-2 border-pink-100 hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex gap-4 mb-3">
                      {listing.primary_photo_url && (
                        <img
                          src={listing.primary_photo_url}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          alt={listing.pet_name}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{listing.pet_name || 'Sem Nome'}</h3>
                            <p className="text-sm text-gray-600">{listing.breed} • {listing.pet_type}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {listing.location_city}
                            </p>
                          </div>
                          <Badge className={
                            listing.status === 'available' ? 'bg-green-600' :
                            listing.status === 'adopted' ? 'bg-blue-600' :
                            listing.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }>
                            {listing.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {listing.urgency_level !== 'normal' && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {listing.urgency_level === 'urgent' ? '⚠️ Urgente' : '🔴 Crítico'}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {listingApps.length} candidaturas
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listing.id}`))}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(listing)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      {listing.status === 'available' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 col-span-2"
                          onClick={() => handleMarkAdopted(listing)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marcar como Adotado
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 col-span-2"
                        onClick={() => handleDelete(listing)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Anúncio: {selectedListing?.pet_name}</DialogTitle>
            </DialogHeader>
            {selectedListing && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="adopted">Adotado</SelectItem>
                      <SelectItem value="on_hold">Em Espera</SelectItem>
                      <SelectItem value="removed">Removido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nível de Urgência</Label>
                  <Select
                    value={editForm.urgency_level}
                    onValueChange={(v) => setEditForm({ ...editForm, urgency_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Taxa de Adoção (€)</Label>
                  <Input
                    type="number"
                    value={editForm.adoption_fee}
                    onChange={(e) => setEditForm({ ...editForm, adoption_fee: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone de Contacto</Label>
                    <Input
                      value={editForm.contact_phone}
                      onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={editForm.contact_whatsapp}
                      onChange={(e) => setEditForm({ ...editForm, contact_whatsapp: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateListingMutation.isPending}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Guardar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}