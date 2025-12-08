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
import { HomeIcon, Plus, Trash2, AlertCircle, Eye, Users, Star, Clock, MapPin, Settings, Heart, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OptimizedImageUpload from "@/components/adoption/OptimizedImageUpload";

export default function ShelterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddNeed, setShowAddNeed] = useState(false);
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Forms state
  const [newNeed, setNewNeed] = useState({ item_name: "", quantity_needed: "", unit: "", urgency: "medium", description: "" });
  const [newVolunteer, setNewVolunteer] = useState({ name: "", email: "", phone: "", role: "walker", notes: "" });
  const [newStory, setNewStory] = useState({ pet_name: "", story: "", adoption_date: "", photo_url: "" });
  const [profileForm, setProfileForm] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myShelter, isLoading: isLoadingShelter } = useQuery({
    queryKey: ['myShelter', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const shelters = await base44.entities.ShelterProfile.filter({ created_by: user.email });
      return shelters[0] || null;
    },
    enabled: !!user?.email,
  });

  // Sync profile form when shelter loads
  React.useEffect(() => {
    if (myShelter) {
      setProfileForm({
        shelter_name: myShelter.shelter_name,
        description: myShelter.description,
        contact_email: myShelter.contact_email,
        contact_phone: myShelter.contact_phone,
        location_address: myShelter.location_address,
        location_city: myShelter.location_city,
        website_url: myShelter.website_url,
        opening_hours: myShelter.opening_hours || "",
        services_offered: myShelter.services_offered || [],
        adoption_policy: myShelter.adoption_policy
      });
    }
  }, [myShelter]);

  const { data: myNeeds = [] } = useQuery({
    queryKey: ['myNeeds', myShelter?.id],
    queryFn: async () => {
      if (!myShelter?.id) return [];
      return await base44.entities.ShelterNeed.filter({ shelter_id: myShelter.id }, '-created_date');
    },
    enabled: !!myShelter?.id,
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['shelterVolunteers', myShelter?.id],
    queryFn: async () => {
      if (!myShelter?.id) return [];
      return await base44.entities.ShelterVolunteer.filter({ shelter_id: myShelter.id });
    },
    enabled: !!myShelter?.id,
  });

  const { data: successStories = [] } = useQuery({
    queryKey: ['shelterStories', myShelter?.id],
    queryFn: async () => {
      if (!myShelter?.id) return [];
      return await base44.entities.SuccessStory.filter({ shelter_id: myShelter.id }, '-created_date');
    },
    enabled: !!myShelter?.id,
  });

  const { data: pendingApplications = [] } = useQuery({
    queryKey: ['shelterPendingApplications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const listings = await base44.entities.AdoptionListing.filter({ created_by: user.email });
      const listingIds = listings.map(l => l.id);
      if (listingIds.length === 0) return [];
      const apps = await base44.entities.AdoptionApplication.list();
      return apps.filter(a => listingIds.includes(a.listing_id) && a.application_status === 'pending');
    },
    enabled: !!user?.email,
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.ShelterProfile.update(myShelter.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myShelter']);
      toast.success('Perfil atualizado com sucesso!');
    }
  });

  const addNeedMutation = useMutation({
    mutationFn: (data) => base44.entities.ShelterNeed.create({ ...data, shelter_id: myShelter.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myNeeds']);
      setShowAddNeed(false);
      setNewNeed({ item_name: "", quantity_needed: "", unit: "", urgency: "medium", description: "" });
      toast.success('Necessidade adicionada!');
    }
  });

  const deleteNeedMutation = useMutation({
    mutationFn: (id) => base44.entities.ShelterNeed.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['myNeeds'])
  });

  const addVolunteerMutation = useMutation({
    mutationFn: (data) => base44.entities.ShelterVolunteer.create({ ...data, shelter_id: myShelter.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shelterVolunteers']);
      setShowAddVolunteer(false);
      setNewVolunteer({ name: "", email: "", phone: "", role: "walker", notes: "" });
      toast.success('Voluntário adicionado!');
    }
  });

  const deleteVolunteerMutation = useMutation({
    mutationFn: (id) => base44.entities.ShelterVolunteer.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['shelterVolunteers'])
  });

  const addStoryMutation = useMutation({
    mutationFn: (data) => base44.entities.SuccessStory.create({ ...data, shelter_id: myShelter.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shelterStories']);
      setShowAddStory(false);
      setNewStory({ pet_name: "", story: "", adoption_date: "", photo_url: "" });
      toast.success('História publicada!');
    }
  });

  const deleteStoryMutation = useMutation({
    mutationFn: (id) => base44.entities.SuccessStory.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['shelterStories'])
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
           <CardContent className="p-8 text-center">
             <h2 className="text-2xl font-bold mb-4">Login Necessário</h2>
             <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Fazer Login</Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingShelter) return <div className="p-8 text-center">A carregar...</div>;

  if (!myShelter) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <Card className="max-w-md text-center p-8">
           <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
           <h2 className="text-2xl font-bold mb-2">Sem abrigo registado</h2>
           <Button onClick={() => navigate(createPageUrl('ShelterRegister'))} className="mt-4 bg-green-600">Registar Abrigo</Button>
         </Card>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-lg">
               <HomeIcon className="w-6 h-6 text-green-700" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-gray-900">{myShelter.shelter_name}</h1>
               <div className="flex items-center gap-2 text-sm text-gray-500">
                 <Badge variant={myShelter.is_verified ? "success" : "secondary"}>
                   {myShelter.is_verified ? "Verificado" : "Pendente"}
                 </Badge>
                 <span>• {myShelter.location_city}</span>
               </div>
             </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl(`ShelterProfile?id=${myShelter.id}`))}>
              <Eye className="w-4 h-4 mr-2" /> Ver Perfil
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate(createPageUrl('ManageAdoptionListings'))}>
              Gerir Animais
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Pending Applications Alert */}
        {pendingApplications.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><Users className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-lg">{pendingApplications.length} Candidaturas Pendentes</p>
                <p className="text-purple-100 text-sm">Existem potenciais adotantes à espera de resposta.</p>
              </div>
            </div>
            <Button onClick={() => navigate(createPageUrl('ManageAdoptionListings'))} className="bg-white text-purple-600 hover:bg-purple-50">
              Ver Candidaturas
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-white border shadow-sm p-1 rounded-xl">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="volunteers">Voluntários</TabsTrigger>
            <TabsTrigger value="stories">Histórias</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Needs Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Necessidades</CardTitle>
                  <Dialog open={showAddNeed} onOpenChange={setShowAddNeed}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Necessidade</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); addNeedMutation.mutate(newNeed); }} className="space-y-4">
                        <Input placeholder="Item (ex: Ração)" value={newNeed.item_name} onChange={e => setNewNeed({...newNeed, item_name: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-2">
                           <Input type="number" placeholder="Quantidade" value={newNeed.quantity_needed} onChange={e => setNewNeed({...newNeed, quantity_needed: e.target.value})} required />
                           <Input placeholder="Unidade (kg, un)" value={newNeed.unit} onChange={e => setNewNeed({...newNeed, unit: e.target.value})} />
                        </div>
                        <Select value={newNeed.urgency} onValueChange={v => setNewNeed({...newNeed, urgency: v})}>
                          <SelectTrigger><SelectValue placeholder="Urgência" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" className="w-full">Adicionar</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myNeeds.length === 0 ? <p className="text-gray-500 text-sm">Sem necessidades registadas.</p> : 
                    myNeeds.map(need => (
                      <div key={need.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{need.item_name}</p>
                          <p className="text-xs text-gray-500">{need.quantity_needed} {need.unit} • {need.urgency}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteNeedMutation.mutate(need.id)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></Button>
                      </div>
                    ))
                  }
                </CardContent>
              </Card>

              {/* Quick Stats or Actions */}
              <div className="grid gap-4">
                 <Card className="bg-blue-50 border-blue-100">
                   <CardContent className="p-6 flex items-center gap-4">
                     <div className="bg-blue-100 p-3 rounded-full"><Users className="w-6 h-6 text-blue-600" /></div>
                     <div>
                       <p className="text-2xl font-bold">{volunteers.length}</p>
                       <p className="text-blue-700 text-sm">Voluntários Ativos</p>
                     </div>
                   </CardContent>
                 </Card>
                 <Card className="bg-green-50 border-green-100">
                   <CardContent className="p-6 flex items-center gap-4">
                     <div className="bg-green-100 p-3 rounded-full"><Star className="w-6 h-6 text-green-600" /></div>
                     <div>
                       <p className="text-2xl font-bold">{successStories.length}</p>
                       <p className="text-green-700 text-sm">Histórias de Sucesso</p>
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          {/* PROFILE EDIT TAB */}
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Editar Perfil</CardTitle></CardHeader>
              <CardContent>
                {profileForm && (
                  <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Abrigo</Label>
                        <Input value={profileForm.shelter_name} onChange={e => setProfileForm({...profileForm, shelter_name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input value={profileForm.website_url} onChange={e => setProfileForm({...profileForm, website_url: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Email Público</Label>
                         <Input value={profileForm.contact_email} onChange={e => setProfileForm({...profileForm, contact_email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <Label>Telefone</Label>
                         <Input value={profileForm.contact_phone} onChange={e => setProfileForm({...profileForm, contact_phone: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição / Missão</Label>
                      <Textarea value={profileForm.description} onChange={e => setProfileForm({...profileForm, description: e.target.value})} rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label>Morada Completa</Label>
                      <Input value={profileForm.location_address} onChange={e => setProfileForm({...profileForm, location_address: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <Label>Horário de Funcionamento</Label>
                      <Textarea 
                        placeholder="Ex: Seg-Sex: 9h-18h, Sáb: 10h-14h" 
                        value={profileForm.opening_hours} 
                        onChange={e => setProfileForm({...profileForm, opening_hours: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Serviços Oferecidos (separados por vírgula)</Label>
                      <Textarea 
                        placeholder="Ex: Vacinação, Microchip, Esterilização, Treino Básico" 
                        value={Array.isArray(profileForm.services_offered) ? profileForm.services_offered.join(', ') : profileForm.services_offered} 
                        onChange={e => setProfileForm({...profileForm, services_offered: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Política de Adoção</Label>
                      <Textarea value={profileForm.adoption_policy} onChange={e => setProfileForm({...profileForm, adoption_policy: e.target.value})} rows={4} />
                    </div>

                    <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" /> Guardar Alterações
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VOLUNTEERS TAB */}
          <TabsContent value="volunteers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Gestão de Voluntários</CardTitle>
                <Dialog open={showAddVolunteer} onOpenChange={setShowAddVolunteer}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Voluntário</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Voluntário</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); addVolunteerMutation.mutate(newVolunteer); }} className="space-y-4">
                      <Input placeholder="Nome Completo" value={newVolunteer.name} onChange={e => setNewVolunteer({...newVolunteer, name: e.target.value})} required />
                      <Input placeholder="Email" type="email" value={newVolunteer.email} onChange={e => setNewVolunteer({...newVolunteer, email: e.target.value})} required />
                      <Input placeholder="Telefone" value={newVolunteer.phone} onChange={e => setNewVolunteer({...newVolunteer, phone: e.target.value})} />
                      <Select value={newVolunteer.role} onValueChange={v => setNewVolunteer({...newVolunteer, role: v})}>
                        <SelectTrigger><SelectValue placeholder="Função" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="walker">Passeador</SelectItem>
                           <SelectItem value="cleaner">Limpeza</SelectItem>
                           <SelectItem value="foster">Família de Acolhimento</SelectItem>
                           <SelectItem value="admin">Administrativo</SelectItem>
                           <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Notas (opcional)" value={newVolunteer.notes} onChange={e => setNewVolunteer({...newVolunteer, notes: e.target.value})} />
                      <Button type="submit" className="w-full">Adicionar Voluntário</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {volunteers.length === 0 ? <p className="text-gray-500 text-center py-6">Nenhum voluntário registado.</p> : (
                  <div className="grid gap-4">
                    {volunteers.map(vol => (
                      <div key={vol.id} className="flex items-center justify-between bg-white border p-4 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="bg-gray-100 p-2 rounded-full"><Users className="w-5 h-5 text-gray-500" /></div>
                           <div>
                             <p className="font-bold text-gray-900">{vol.name}</p>
                             <p className="text-sm text-gray-500">{vol.role} • {vol.email}</p>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteVolunteerMutation.mutate(vol.id)}>
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUCCESS STORIES TAB */}
          <TabsContent value="stories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Histórias de Sucesso</CardTitle>
                <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova História</Button></DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Adicionar História de Sucesso</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <OptimizedImageUpload 
                        onImagesChange={(urls) => setNewStory({...newStory, photo_url: urls[0]})}
                        currentImages={newStory.photo_url ? [newStory.photo_url] : []}
                        maxImages={1}
                        label="Foto do Final Feliz"
                      />
                      <Input placeholder="Nome do Animal" value={newStory.pet_name} onChange={e => setNewStory({...newStory, pet_name: e.target.value})} />
                      <Input type="date" value={newStory.adoption_date} onChange={e => setNewStory({...newStory, adoption_date: e.target.value})} />
                      <Textarea placeholder="Conte a história..." value={newStory.story} onChange={e => setNewStory({...newStory, story: e.target.value})} rows={5} />
                      <Button onClick={() => addStoryMutation.mutate(newStory)} className="w-full">Publicar História</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {successStories.length === 0 ? <p className="text-gray-500 text-center py-6">Ainda sem histórias partilhadas.</p> : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {successStories.map(story => (
                      <Card key={story.id} className="overflow-hidden">
                        <div className="h-48 bg-gray-200 relative">
                          {story.photo_url && <img src={story.photo_url} alt={story.pet_name} className="w-full h-full object-cover" />}
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => deleteStoryMutation.mutate(story.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-bold">{story.pet_name}</h4>
                          <p className="text-xs text-gray-500 mb-2">Adotado em {story.adoption_date}</p>
                          <p className="text-sm text-gray-700 line-clamp-3">{story.story}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}