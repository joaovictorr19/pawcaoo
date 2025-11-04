
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, TrendingUp, DollarSign, Package, Megaphone,
  Calendar, Upload, PlusCircle, Edit, Trash2, BarChart3, Users
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company } = useQuery({
    queryKey: ['partnerCompany', user?.email],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ company_email: user?.email });
      return companies[0];
    },
    enabled: !!user,
  });

  const { data: announcements } = useQuery({
    queryKey: ['companyAnnouncements', user?.email],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({ company_email: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: services } = useQuery({
    queryKey: ['partnerServices', company?.id],
    queryFn: () => base44.entities.PartnerService.filter({ partner_id: company?.id }),
    enabled: !!company,
    initialData: [],
  });

  const { data: bookings } = useQuery({
    queryKey: ['serviceBookings', company?.id],
    queryFn: () => base44.entities.ServiceBooking.filter({ partner_id: company?.id }),
    enabled: !!company,
    initialData: [],
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      if (editingAnnouncement) {
        return await base44.entities.CompanyAnnouncement.update(editingAnnouncement.id, data);
      }
      return await base44.entities.CompanyAnnouncement.create({
        ...data,
        company_id: company?.id || user?.company_id,
        company_name: company?.company_name || user?.full_name,
        company_email: user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAnnouncements'] });
      toast.success(editingAnnouncement ? "Anúncio atualizado!" : "Anúncio criado! Aguardando aprovação do admin.");
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
    },
    onError: (error) => {
      console.error("Error saving announcement:", error);
      toast.error("Erro ao salvar anúncio: " + error.message);
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAnnouncements'] });
      toast.success("Anúncio eliminado!");
    },
  });

  const saveServiceMutation = useMutation({
    mutationFn: async (data) => {
      if (editingService) {
        return await base44.entities.PartnerService.update(editingService.id, data);
      }
      return await base44.entities.PartnerService.create({
        ...data,
        partner_id: company?.id || user?.company_id || 'temp-' + Date.now(),
        partner_name: company?.company_name || user?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
      setShowServiceForm(false);
      setEditingService(null);
      toast.success(editingService ? "Serviço atualizado!" : "Serviço criado com sucesso!");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId) => base44.entities.PartnerService.delete(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerServices'] });
      toast.success("Serviço removido!");
    },
  });

  if (!user || user.account_type !== 'company') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600">Apenas empresas parceiras podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { icon: Package, value: services.length, label: "Serviços", color: "from-blue-600 to-cyan-600" },
    { icon: Calendar, value: bookings.length, label: "Agendamentos", color: "from-green-600 to-emerald-600" },
    { icon: DollarSign, value: `€${bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0).toFixed(0)}`, label: "Receita", color: "from-purple-600 to-pink-600" },
    { icon: Users, value: bookings.filter(b => b.status === 'completed').length, label: "Completados", color: "from-orange-600 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Painel Parceiro</h1>
              <p className="text-gray-600 font-medium">{company?.company_name || user?.full_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 h-14 mb-6">
            <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
            <TabsTrigger value="services">🏥 Serviços ({services.length})</TabsTrigger>
            <TabsTrigger value="announcements">📢 Anúncios ({announcements.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Agendamentos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum agendamento ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold">{booking.dog_name} - {booking.service_name}</p>
                          <p className="text-sm text-gray-600">{booking.owner_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.booking_date), "d 'de' MMM", { locale: ptBR })} às {booking.booking_time}
                          </p>
                        </div>
                        <Badge className={
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gerir Serviços</h2>
              <Button
                onClick={() => { setShowServiceForm(true); setEditingService(null); }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Criar Novo Serviço
              </Button>
            </div>

            {showServiceForm && <ServiceForm />}

            {services.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum serviço cadastrado</h3>
                  <p className="text-gray-600">Crie seu primeiro serviço para começar a receber agendamentos!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.service_name}
                          className="w-full h-48 object-cover rounded-t-xl"
                        />
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg">{service.service_name}</h3>
                          {service.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="text-2xl font-bold text-green-600 mb-4">
                          €{service.base_price}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este serviço?')) {
                                deleteServiceMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Gerir Anúncios & Promoções</h2>
              <Button onClick={() => {
                  setEditingAnnouncement(null);
                  setShowAnnouncementForm(true);
                }} className="bg-purple-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                Criar Anúncio
              </Button>
            </div>
            
            {showAnnouncementForm && <AnnouncementForm />}
            
            <p className="text-gray-600 mb-4">Gerencie seus anúncios promocionais aqui.</p>

            <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className={`p-4 hover:shadow-lg transition-shadow ${
                      announcement.is_featured ? 'border-2 border-yellow-400' : ''
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {announcement.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                <TrendingUp className="w-3 h-3 mr-1" /> {/* Using TrendingUp as a generic 'featured' icon */}
                                {announcement.featured_tier?.toUpperCase()}
                              </Badge>
                            )}
                            <h3 className="font-bold text-lg text-gray-900">{announcement.title}</h3>
                            <Badge>{announcement.promotion_type}</Badge>
                            {announcement.discount_percentage > 0 && (
                              <Badge className="bg-red-500 text-white">
                                -{announcement.discount_percentage}%
                              </Badge>
                            )}
                            <Badge className={
                                announcement.moderation_status === 'approved' ? 'bg-green-500' :
                                announcement.moderation_status === 'rejected' ? 'bg-red-500' :
                                announcement.moderation_status === 'changes_requested' ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }>
                                {announcement.moderation_status === 'approved' ? '✅ Aprovado' :
                                 announcement.moderation_status === 'rejected' ? '❌ Rejeitado' :
                                 announcement.moderation_status === 'changes_requested' ? '⚠️ Mudanças Solicitadas' :
                                 '⏳ Pendente'}
                              </Badge>
                          </div>
                          
                          {announcement.image_url && (
                            <img src={announcement.image_url} alt="" className="w-full max-w-md h-32 object-cover rounded-lg mb-3" />
                          )}

                          <p className="text-gray-600 mb-3">{announcement.message}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <TrendingUp className="w-4 h-4" /> {/* Reusing TrendingUp for views */}
                                Visualizações
                              </div>
                              <p className="text-xl font-bold text-gray-900">{announcement.views_count || 0}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Megaphone className="w-4 h-4" /> {/* Reusing Megaphone for clicks */}
                                Cliques
                              </div>
                              <p className="text-xl font-bold text-gray-900">{announcement.clicks_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Taxa de Cliques</p>
                              <p className="text-xl font-bold text-green-600">
                                {announcement.views_count > 0 
                                  ? ((announcement.clicks_count / announcement.views_count) * 100).toFixed(1)
                                  : 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Conversões</p>
                              <p className="text-xl font-bold text-purple-600">{announcement.conversions_count || 0}</p>
                            </div>
                          </div>

                          {announcement.is_featured && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm font-semibold text-gray-900">
                                Em destaque até: {new Date(announcement.featured_end_date).toLocaleDateString('pt-PT')}
                              </p>
                              <p className="text-xs text-gray-600">
                                Valor pago: €{announcement.featured_payment_amount}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => {
                            setEditingAnnouncement(announcement);
                            setShowAnnouncementForm(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function ServiceForm() {
    const [formData, setFormData] = useState(editingService || {
      service_name: "",
      service_type: "bath",
      description: "",
      duration_minutes: 60,
      base_price: 0,
      price_by_size: { small: 0, medium: 0, large: 0, extra_large: 0 },
      includes: [],
      requirements: [],
      available_days: [],
      is_active: true,
      is_emergency: false,
      image_url: "",
    });

    const [newInclude, setNewInclude] = useState("");
    const [newRequirement, setNewRequirement] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, image_url: file_url });
        toast.success("Imagem carregada!");
      } catch (error) {
        toast.error("Erro ao carregar imagem");
      }
      setUploadingImage(false);
    };

    return (
      <Card className="bg-blue-50 border-2 border-blue-200 mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {editingService ? 'Editar Serviço' : 'Criar Novo Serviço'}
          </h3>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Serviço *</Label>
                <Input
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  placeholder="Ex: Banho Completo Premium"
                />
              </div>

              <div>
                <Label>Tipo de Serviço *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(v) => setFormData({...formData, service_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bath">🛁 Banho</SelectItem>
                    <SelectItem value="grooming">✂️ Grooming</SelectItem>
                    <SelectItem value="veterinary">🏥 Veterinário</SelectItem>
                    <SelectItem value="vaccination">💉 Vacinação</SelectItem>
                    <SelectItem value="checkup">🩺 Check-up</SelectItem>
                    <SelectItem value="emergency">🚨 Emergência</SelectItem>
                    <SelectItem value="training">🎓 Treino</SelectItem>
                    <SelectItem value="daycare">🏠 Creche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o serviço..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label>Preço Base (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Preços por Tamanho</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Pequeno (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.small || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, small: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Médio (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.medium || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, medium: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Grande (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.large || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, large: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Extra Grande (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.extra_large || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, extra_large: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>O que está incluído</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newInclude}
                  onChange={(e) => setNewInclude(e.target.value)}
                  placeholder="Ex: Shampoo premium"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newInclude.trim()) {
                        setFormData({...formData, includes: [...(formData.includes || []), newInclude.trim()]});
                        setNewInclude("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newInclude.trim()) {
                      setFormData({...formData, includes: [...(formData.includes || []), newInclude.trim()]});
                      setNewInclude("");
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.includes || []).map((item, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-800">
                    {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, includes: formData.includes.filter((_, i) => i !== idx)})}
                      className="ml-2"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Requisitos</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Ex: Vacinas em dia"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newRequirement.trim()) {
                        setFormData({...formData, requirements: [...(formData.requirements || []), newRequirement.trim()]});
                        setNewRequirement("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newRequirement.trim()) {
                      setFormData({...formData, requirements: [...(formData.requirements || []), newRequirement.trim()]});
                      setNewRequirement("");
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.requirements || []).map((item, idx) => (
                  <Badge key={idx} className="bg-orange-100 text-orange-800">
                    {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, i) => i !== idx)})}
                      className="ml-2"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Dias Disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(formData.available_days || []).includes(day)}
                      onCheckedChange={() => {
                        const days = formData.available_days || [];
                        setFormData({
                          ...formData,
                          available_days: days.includes(day) ? days.filter(d => d !== day) : [...days, day]
                        });
                      }}
                    />
                    <span className="text-sm capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Imagem do Serviço</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_emergency}
                onCheckedChange={(checked) => setFormData({...formData, is_emergency: checked})}
              />
              <Label>Serviço de Emergência (24/7)</Label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => { setShowServiceForm(false); setEditingService(null); }} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={() => saveServiceMutation.mutate(formData)}
              className="bg-blue-600"
              disabled={!formData.service_name || !formData.description || formData.base_price <= 0}
            >
              {editingService ? 'Atualizar' : 'Criar'} Serviço
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function AnnouncementForm() {
    const [formData, setFormData] = useState(editingAnnouncement || {
      title: "",
      message: "",
      promotion_type: "discount",
      discount_percentage: 0,
      image_url: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_active: true,
      is_featured: false,
      featured_tier: "none",
      moderation_status: "pending", // Added
      company_email: user?.email // Added
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, image_url: file_url });
        toast.success("Imagem carregada!");
      } catch (error) {
        toast.error("Erro ao carregar imagem");
      }
      setUploadingImage(false);
    };

    const featuredPricing = {
      basic: 49,
      premium: 99,
      exclusive: 199
    };

    return (
      <Card className="bg-purple-50 border-2 border-purple-200 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
            </h3>
            {editingAnnouncement?.moderation_status && (
              <Badge className={
                editingAnnouncement.moderation_status === 'approved' ? 'bg-green-500' :
                editingAnnouncement.moderation_status === 'rejected' ? 'bg-red-500' :
                editingAnnouncement.moderation_status === 'changes_requested' ? 'bg-yellow-500' :
                'bg-orange-500'
              }>
                {editingAnnouncement.moderation_status === 'approved' ? '✅ Aprovado' :
                 editingAnnouncement.moderation_status === 'rejected' ? '❌ Rejeitado' :
                 editingAnnouncement.moderation_status === 'changes_requested' ? '⚠️ Mudanças Solicitadas' :
                 '⏳ Aguardando Aprovação'}
              </Badge>
            )}
          </div>

          {editingAnnouncement?.moderation_status === 'rejected' && editingAnnouncement?.rejection_reason && (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="font-semibold text-red-900 mb-1">Motivo da Rejeição:</p>
              <p className="text-sm text-red-800">{editingAnnouncement.rejection_reason}</p>
            </div>
          )}

          {editingAnnouncement?.moderation_notes && (
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <p className="font-semibold text-blue-900 mb-1">Notas do Admin:</p>
              <p className="text-sm text-blue-800">{editingAnnouncement.moderation_notes}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Título do Anúncio *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: 25% de Desconto em Toda a Loja!"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={3}
                placeholder="Descreva a sua promoção..."
              />
            </div>
            <div>
              <Label>Tipo de Promoção *</Label>
              <Select value={formData.promotion_type} onValueChange={(v) => setFormData({...formData, promotion_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  <SelectItem value="discount">Desconto</SelectItem>
                  <SelectItem value="new_product">Novo Produto</SelectItem>
                  <SelectItem value="points_bonus">Bónus de Pontos</SelectItem>
                  <SelectItem value="free_gift">Oferta Grátis</SelectItem>
                  <SelectItem value="seasonal">Sazonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Data Início *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Imagem do Anúncio</Label>
              <div className="flex gap-2">
                <label className="cursor-pointer flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingImage} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "A carregar..." : "Carregar Imagem"}
                    </span>
                  </Button>
                </label>
              </div>
              {formData.image_url && (
                <img src={formData.image_url} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>

            {/* Featured Options */}
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <Label className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                Opções de Destaque (Pago)
              </Label>
              <Select 
                value={formData.featured_tier} 
                onValueChange={(v) => setFormData({
                  ...formData, 
                  featured_tier: v,
                  is_featured: v !== 'none',
                  featured_payment_amount: v !== 'none' ? featuredPricing[v] : 0
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Destaque (Grátis - Sujeito a aprovação)</SelectItem>
                  <SelectItem value="basic">⭐ Basic - €49/mês</SelectItem>
                  <SelectItem value="premium">⭐⭐ Premium - €99/mês</SelectItem>
                  <SelectItem value="exclusive">⭐⭐⭐ Exclusive - €199/mês</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.featured_tier !== 'none' && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-gray-900 mb-2">
                    💰 Valor: €{featuredPricing[formData.featured_tier]}/mês
                  </p>
                  <div className="grid md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Data Início Destaque</Label>
                      <Input
                        type="date"
                        value={formData.featured_start_date || formData.start_date}
                        onChange={(e) => setFormData({...formData, featured_start_date: e.target.value})}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data Fim Destaque</Label>
                      <Input
                        type="date"
                        value={formData.featured_end_date}
                        onChange={(e) => setFormData({...formData, featured_end_date: e.target.value})}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900 font-semibold mb-1">📋 Benefícios do {formData.featured_tier}:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {formData.featured_tier === 'basic' && (
                        <>
                          <li>✓ Aparece no topo da sua categoria</li>
                          <li>✓ Badge "Em Destaque"</li>
                          <li>✓ 3x mais visibilidade</li>
                        </>
                      )}
                      {formData.featured_tier === 'premium' && (
                        <>
                          <li>✓ Topo de TODAS as páginas</li>
                          <li>✓ Banner grande na homepage</li>
                          <li>✓ Badge "Premium Partner"</li>
                          <li>✓ 10x mais visibilidade</li>
                          <li>✓ Email marketing dedicado</li>
                        </>
                      )}
                      {formData.featured_tier === 'exclusive' && (
                        <>
                          <li>✓ Posição #1 garantida</li>
                          <li>✓ Banner exclusivo homepage</li>
                          <li>✓ Push notifications para usuários</li>
                          <li>✓ Email marketing VIP</li>
                          <li>✓ Visibilidade máxima</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ O pagamento será processado após aprovação do admin
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900 font-semibold mb-1">
              📋 Processo de Aprovação
            </p>
            <p className="text-xs text-blue-800">
              Todos os anúncios passam por aprovação do admin PawCão antes de ficarem visíveis na loja. 
              Você receberá uma notificação quando seu anúncio for aprovado ou se houver algum problema.
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={() => setShowAnnouncementForm(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={() => saveAnnouncementMutation.mutate(formData)} className="bg-purple-600">
              {editingAnnouncement ? 'Atualizar' : 'Submeter'} Anúncio
              {!editingAnnouncement && ' para Aprovação'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
