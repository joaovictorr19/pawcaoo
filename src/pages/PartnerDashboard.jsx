
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
  Store, TrendingUp, DollarSign, Package, Calendar,
  PlusCircle, Edit, Trash2, Users, ArrowUp, ArrowDown, Activity, Crown,
  BarChart3, Clock, CheckCircle, AlertTriangle, Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  const { data: company } = useQuery({
    queryKey: ['partnerCompany', user?.email],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ company_email: user?.email });
      return companies[0] || null;
    },
    enabled: !!user,
    staleTime: 300000,
  });

  const { data: services } = useQuery({
    queryKey: ['partnerServices', company?.id],
    queryFn: () => base44.entities.PartnerService.filter({ partner_id: company?.id }),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 60000,
  });

  const { data: bookings } = useQuery({
    queryKey: ['serviceBookings', company?.id],
    queryFn: () => base44.entities.ServiceBooking.filter({ partner_id: company?.id }, '-created_date'),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 30000,
  });

  const { data: myAnnouncements } = useQuery({
    queryKey: ['myAnnouncements', company?.id],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({ company_id: company?.id }, '-created_date'),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 60000,
  });

  const saveServiceMutation = useMutation({
    mutationFn: async (data) => {
      if (!company?.id) {
        throw new Error("Empresa não encontrada. Contacte o administrador.");
      }

      // Se está editando um serviço existente, marca para aprovação
      if (editingService) {
        // When editing, changes are stored in pending_changes and the service goes to 'pending' status
        return await base44.entities.PartnerService.update(editingService.id, {
          // The current data will represent the new proposed state
          ...data,
          // Store the proposed changes for admin review
          pending_changes: data,
          // Mark as pending for moderation
          moderation_status: 'pending',
          last_edit_date: new Date().toISOString()
        });
      }

      // Novo serviço
      return await base44.entities.PartnerService.create({
        ...data,
        partner_id: company.id,
        partner_name: company.company_name,
        moderation_status: 'approved' // Novos serviços são aprovados automaticamente
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerServices']);
      setShowServiceForm(false);
      setEditingService(null);
      toast.success(editingService ? "Alterações enviadas para aprovação!" : "Serviço criado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar serviço");
      console.error(error);
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId) => base44.entities.PartnerService.delete(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerServices']);
      toast.success("Serviço removido!");
    },
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      if (!company?.id) {
        throw new Error("Empresa não encontrada. Contacte o administrador.");
      }

      if (editingAnnouncement) {
        return await base44.entities.CompanyAnnouncement.update(editingAnnouncement.id, {
          ...data,
          moderation_status: 'pending',
          last_edit_date: new Date().toISOString()
        });
      }

      return await base44.entities.CompanyAnnouncement.create({
        ...data,
        company_id: company.id,
        company_name: company.company_name,
        company_email: user.email,
        moderation_status: 'pending',
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAnnouncements']);
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      toast.success(editingAnnouncement ? "Alterações enviadas para aprovação!" : "Anúncio enviado para aprovação!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar anúncio");
      console.error(error);
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId) => base44.entities.CompanyAnnouncement.delete(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myAnnouncements']);
      toast.success("Anúncio removido!");
    },
  });

  if (!user || user.account_type !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Apenas empresas parceiras podem acessar esta página.</p>
            <p className="text-sm text-gray-500">Tipo de conta atual: {user?.account_type || 'não definido'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Empresa Não Encontrada</h2>
            <p className="text-gray-600 mb-4">
              Não encontramos uma empresa associada ao seu email: <strong>{user.email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Por favor, contacte o administrador para configurar sua empresa parceira.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analytics Calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  });

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return bookingDate.getMonth() === lastMonth.getMonth() && bookingDate.getFullYear() === lastMonth.getFullYear();
  });

  const currentMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const revenueChange = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : (currentMonthRevenue > 0 ? 100 : 0); // If last month was 0, but current is > 0, it's 100% growth or 0 if both 0.


  const bookingsChange = lastMonthBookings.length > 0
    ? ((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length * 100).toFixed(1)
    : (thisMonthBookings.length > 0 ? 100 : 0);

  const activeServices = services.filter(s => s.moderation_status === 'approved' && s.is_active);
  const pendingApprovalServices = services.filter(s => s.moderation_status === 'pending');
  // const rejectedServices = services.filter(s => s.moderation_status === 'rejected'); // Not used in stats but could be for a specific alert

  // Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'EEE', { locale: ptBR });
  });

  const revenueChartData = last7Days.map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_date);
      return bookingDate.toDateString() === date.toDateString();
    });
    return {
      name: day,
      receita: dayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      agendamentos: dayBookings.length
    };
  });

  const stats = [
    {
      icon: Package,
      value: activeServices.length,
      label: "Serviços Ativos",
      color: "bg-blue-600",
      change: pendingApprovalServices.length > 0 ? `${pendingApprovalServices.length} aguardando aprovação` : null
    },
    {
      icon: Calendar,
      value: thisMonthBookings.length,
      label: "Agendamentos (Mês)",
      color: "bg-green-600",
      change: `${bookingsChange >= 0 ? '+' : ''}${bookingsChange}% vs mês anterior`
    },
    {
      icon: DollarSign,
      value: `€${currentMonthRevenue.toFixed(0)}`,
      label: "Receita (Mês)",
      color: "bg-purple-600",
      change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}% vs mês anterior`
    },
    {
      icon: Users,
      value: pendingBookings.length,
      label: "Agend. Pendentes",
      color: "bg-orange-600",
      change: `${completedBookings.length} completados`
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Parceiro</h1>
              <p className="text-sm text-gray-600">{company?.company_name}</p>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                  {stat.change && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      {stat.change.includes('+') ? <ArrowUp className="w-3 h-3 mr-1 text-green-500" /> :
                       stat.change.includes('-') ? <ArrowDown className="w-3 h-3 mr-1 text-red-500" /> : null}
                      {stat.change}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-lg p-1 h-12 mb-4">
            <TabsTrigger value="overview" className="text-sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="services" className="text-sm">
              <Package className="w-4 h-4 mr-2" />
              Serviços ({services.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm">
              <Megaphone className="w-4 h-4 mr-2" />
              Anúncios ({myAnnouncements.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamentos ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Revenue Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Receita dos Últimos 7 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${value.toFixed(2)}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke="#8b5cf6" strokeWidth={2} name="Receita (€)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Agendamentos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Nenhum agendamento ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">{booking.dog_name}</p>
                            <Badge className="text-xs">
                              {booking.service_name}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{booking.owner_name} • {booking.owner_phone}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.booking_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })} às {booking.booking_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</p>
                          <Badge className={`text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'completed' ? '✅ Completado' :
                             booking.status === 'confirmed' ? '📋 Confirmado' :
                             booking.status === 'pending' ? '⏳ Pendente' :
                             '❌ Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Gerir Serviços</h2>
              <Button
                onClick={() => { setShowServiceForm(true); setEditingService(null); }}
                className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Serviço
              </Button>
            </div>

            {showServiceForm && <ServiceForm />}

            {services.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum serviço cadastrado</h3>
                  <p className="text-gray-600">Crie seu primeiro serviço para começar a receber agendamentos!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id}>
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
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
                          <div className="flex flex-col items-end gap-1">
                            {service.moderation_status === 'approved' && service.is_active && (
                              <Badge className="bg-green-100 text-green-800 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                              </Badge>
                            )}
                            {service.moderation_status === 'pending' && (
                              <Badge className="bg-orange-100 text-orange-800 flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> Pendente Aprovação
                              </Badge>
                            )}
                            {service.moderation_status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Rejeitado
                              </Badge>
                            )}
                            {service.moderation_status === 'approved' && !service.is_active && (
                              <Badge className="bg-gray-100 text-gray-800">⚪ Inativo</Badge>
                            )}
                            {service.pending_changes && service.moderation_status === 'approved' && (
                              <Badge variant="outline" className="border-orange-500 text-orange-800 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Alterações Pendentes
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                        <div className="text-2xl font-bold text-green-600 mb-4">
                          €{service.base_price}
                        </div>
                        {service.moderation_status === 'rejected' && service.rejection_reason && (
                          <div className="mt-4 p-3 bg-red-100 border-2 border-red-300 rounded-lg">
                            <p className="text-sm font-bold text-red-900 mb-1">Motivo da Rejeição:</p>
                            <p className="text-sm text-red-700">{service.rejection_reason}</p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              // If there are pending changes, load them into the form for further editing
                              // Otherwise, load the current service data
                              setEditingService(service.pending_changes ? { ...service, ...service.pending_changes } : service);
                              setShowServiceForm(true);
                            }}
                            disabled={service.moderation_status === 'pending'} // Cannot edit if already pending approval
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {service.moderation_status === 'pending' ? 'Em Análise' : 'Editar'}
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
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gerir Anúncios</h2>
                <p className="text-sm text-gray-600">Crie promoções para aparecer na loja PawCão</p>
              </div>
              <Button
                onClick={() => { setShowAnnouncementForm(true); setEditingAnnouncement(null); }}
                className="bg-purple-600 hover:bg-purple-700 h-9 text-sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Button>
            </div>

            {showAnnouncementForm && <AnnouncementForm />}

            {myAnnouncements.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum anúncio criado</h3>
                  <p className="text-gray-600">Crie anúncios promocionais para atrair mais clientes!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className={`border-2 shadow-lg ${
                    announcement.moderation_status === 'approved' ? 'border-green-200 bg-green-50' :
                    announcement.moderation_status === 'rejected' ? 'border-red-200 bg-red-50' :
                    'border-orange-200 bg-orange-50'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900">{announcement.title}</h3>
                            <Badge className={`flex items-center ${
                              announcement.moderation_status === 'approved' ? 'bg-green-600' :
                              announcement.moderation_status === 'rejected' ? 'bg-red-600' :
                              'bg-orange-600'
                            }`}>
                              {announcement.moderation_status === 'approved' ? (<><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</>) :
                               announcement.moderation_status === 'rejected' ? (<><AlertTriangle className="w-3 h-3 mr-1" /> Rejeitado</>) :
                               (<><Clock className="w-3 h-3 mr-1" /> Pendente Aprovação</>)}
                            </Badge>
                            {announcement.is_featured && (
                              <Badge className="bg-yellow-500 text-yellow-50 flex items-center">
                                <Crown className="w-3 h-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3">{announcement.message}</p>

                          {announcement.image_url && (
                            <img
                              src={announcement.image_url}
                              alt={announcement.title}
                              className="w-full md:w-64 h-40 object-cover rounded-lg mb-3"
                            />
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Tipo</p>
                              <p className="font-bold capitalize">{announcement.promotion_type}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Desconto</p>
                              <p className="font-bold text-red-600">{announcement.discount_percentage}%</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Visualizações</p>
                              <p className="font-bold text-blue-600">{announcement.views_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Cliques</p>
                              <p className="font-bold text-green-600">{announcement.clicks_count || 0}</p>
                            </div>
                          </div>

                          {announcement.moderation_status === 'rejected' && announcement.rejection_reason && (
                            <div className="mt-4 p-3 bg-red-100 border-2 border-red-300 rounded-lg">
                              <p className="text-sm font-bold text-red-900 mb-1">Motivo da Rejeição:</p>
                              <p className="text-sm text-red-700">{announcement.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(announcement.moderation_status === 'pending' || announcement.moderation_status === 'rejected') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setShowAnnouncementForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este anúncio?')) {
                              deleteAnnouncementMutation.mutate(announcement.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Todos os Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Nenhum agendamento ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">{booking.dog_name}</p>
                            <Badge className="text-xs">{booking.service_name}</Badge>
                          </div>
                          <p className="text-xs text-gray-600">{booking.owner_name} • {booking.owner_phone}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.booking_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })} às {booking.booking_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</p>
                          <Badge className={`text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'completed' ? '✅ Completado' :
                             booking.status === 'confirmed' ? '📋 Confirmado' :
                             booking.status === 'pending' ? '⏳ Pendente' :
                             '❌ Cancelado'}
                          </Badge>
                        </div>
                      </div>
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

  function AnnouncementForm() {
    const [formData, setFormData] = useState(editingAnnouncement ? {
      ...editingAnnouncement,
      start_date: editingAnnouncement.start_date ? new Date(editingAnnouncement.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: editingAnnouncement.end_date ? new Date(editingAnnouncement.end_date).toISOString().split('T')[0] : "",
      featured_start_date: editingAnnouncement.featured_start_date ? new Date(editingAnnouncement.featured_start_date).toISOString().split('T')[0] : "",
      featured_end_date: editingAnnouncement.featured_end_date ? new Date(editingAnnouncement.featured_end_date).toISOString().split('T')[0] : "",
    } : {
      title: "",
      message: "",
      promotion_type: "discount",
      discount_percentage: 0,
      bonus_points_multiplier: 1,
      target_subscription_tier: ["free", "basic", "premium", "vip"],
      image_url: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_featured: false,
      featured_tier: "none",
      featured_payment_amount: 0,
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

    const handleSubmit = () => {
      if (!formData.title || !formData.message || !formData.promotion_type) {
        toast.error("Preencha todos os campos obrigatórios (*)");
        return;
      }
      saveAnnouncementMutation.mutate(formData);
    };

    const featuredPrices = {
      none: 0,
      basic: 50,
      premium: 150,
      exclusive: 500
    };

    return (
      <Card className="bg-purple-50 border-2 border-purple-200 mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio Promocional'}
          </h3>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Importante:</strong> Todos os anúncios passam por aprovação do administrador antes de ficarem visíveis na loja.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Título do Anúncio *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Mega Desconto de Verão!"
                required
              />
            </div>

            <div>
              <Label>Mensagem/Descrição *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Descreva a promoção em detalhes..."
                rows={4}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Promoção *</Label>
                <Select
                  value={formData.promotion_type}
                  onValueChange={(v) => setFormData({...formData, promotion_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flash_sale">⚡ Flash Sale</SelectItem>
                    <SelectItem value="new_product">🆕 Novo Produto</SelectItem>
                    <SelectItem value="discount">🏷️ Desconto</SelectItem>
                    <SelectItem value="points_bonus">⭐ Bónus de Pontos</SelectItem>
                    <SelectItem value="free_gift">🎁 Oferta Grátis</SelectItem>
                    <SelectItem value="seasonal">🌸 Promoção Sazonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Percentagem de Desconto (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value) || 0})}
                  placeholder="Ex: 20"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Data de Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Imagem do Anúncio (recomendado)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="mb-2"
              />
              {uploadingImage && <p className="text-sm text-gray-500">Carregando imagem...</p>}
              {formData.image_url && (
                <div className="mt-3">
                  <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
                </div>
              )}
            </div>

            {/* Featured Options */}
            <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-600" />
                <h4 className="font-bold text-yellow-900">Destacar Anúncio (Pago)</h4>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { tier: 'none', name: 'Sem Destaque', price: 0, desc: 'Anúncio normal' },
                  { tier: 'basic', name: 'Básico', price: 50, desc: 'Aparece na lista' },
                  { tier: 'premium', name: 'Premium', price: 150, desc: 'Destaque no topo' },
                  { tier: 'exclusive', name: 'Exclusivo', price: 500, desc: 'Banner principal' }
                ].map(option => (
                  <label
                    key={option.tier}
                    className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.featured_tier === option.tier
                        ? 'border-yellow-500 bg-yellow-100'
                        : 'border-gray-200 bg-white hover:border-yellow-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="featured_tier"
                      value={option.tier}
                      checked={formData.featured_tier === option.tier}
                      onChange={(e) => setFormData({
                        ...formData,
                        featured_tier: e.target.value,
                        featured_payment_amount: featuredPrices[e.target.value],
                        is_featured: e.target.value !== 'none'
                      })}
                      className="mb-2"
                    />
                    <p className="font-bold text-gray-900">{option.name}</p>
                    <p className="text-2xl font-black text-yellow-700 my-2">€{option.price}</p>
                    <p className="text-xs text-gray-600">{option.desc}</p>
                  </label>
                ))}
              </div>

              {formData.is_featured && formData.featured_tier !== 'none' && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    ⚠️ <strong>Pagamento:</strong> Após aprovação do admin, você receberá instruções de pagamento de <strong>€{formData.featured_payment_amount}</strong>.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Início do Destaque</Label>
                      <Input
                        type="date"
                        value={formData.featured_start_date || formData.start_date}
                        onChange={(e) => setFormData({...formData, featured_start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim do Destaque</Label>
                      <Input
                        type="date"
                        value={formData.featured_end_date || formData.end_date}
                        onChange={(e) => setFormData({...formData, featured_end_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={saveAnnouncementMutation.isPending || uploadingImage}
            >
              {saveAnnouncementMutation.isPending ? "A enviar..." : editingAnnouncement ? '💾 Atualizar Anúncio' : '📤 Enviar para Aprovação'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function ServiceForm() {
    // When editing, if there are pending_changes, we want to load those into the form
    // Otherwise, load the existing service data
    const initialFormData = editingService?.pending_changes ? { ...editingService, ...editingService.pending_changes } : editingService || {
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
      emergency_surcharge: 0,
      image_url: "",
    };

    const [formData, setFormData] = useState(initialFormData);

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

    const handlePriceChange = (field, value) => {
      // Remove leading zeros and parse as float
      const cleanValue = value.replace(/^0+(?=\d)/, '');
      const numValue = parseFloat(cleanValue) || 0;
      setFormData({...formData, [field]: numValue});
    };

    const handlePriceBySizeChange = (size, value) => {
      // Remove leading zeros and parse as float
      const cleanValue = value.replace(/^0+(?=\d)/, '');
      const numValue = parseFloat(cleanValue) || 0;
      setFormData({
        ...formData,
        price_by_size: {...(formData.price_by_size || {}), [size]: numValue}
      });
    };

    const handleSubmit = () => {
      if (!formData.service_name || !formData.description || formData.base_price <= 0) {
        toast.error("Preencha todos os campos obrigatórios: Nome, Descrição e Preço Base > 0");
        return;
      }

      // Ensure all prices are numbers
      const cleanedData = {
        ...formData,
        base_price: parseFloat(formData.base_price) || 0,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        emergency_surcharge: parseFloat(formData.emergency_surcharge) || 0,
        price_by_size: {
          small: parseFloat(formData.price_by_size?.small) || 0,
          medium: parseFloat(formData.price_by_size?.medium) || 0,
          large: parseFloat(formData.price_by_size?.large) || 0,
          extra_large: parseFloat(formData.price_by_size?.extra_large) || 0,
        }
      };

      saveServiceMutation.mutate(cleanedData);
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
                  required
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
                    <SelectItem value="surgery">⚕️ Cirurgia</SelectItem>
                    <SelectItem value="emergency">🚨 Emergência</SelectItem>
                    <SelectItem value="pharmacy">💊 Farmácia</SelectItem>
                    <SelectItem value="training">🎓 Treino</SelectItem>
                    <SelectItem value="daycare">🏠 Creche</SelectItem>
                    <SelectItem value="boarding">🏡 Hospedagem</SelectItem>
                    <SelectItem value="transport">🚗 Transporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o serviço em detalhes..."
                rows={3}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 60})}
                  min="15"
                  step="15"
                />
              </div>

              <div>
                <Label>Preço Base (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.base_price || ''}
                  onChange={(e) => handlePriceChange('base_price', e.target.value)}
                  placeholder="Ex: 20"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Insira o preço sem zeros à esquerda (ex: 20, não 020)</p>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Preços por Tamanho (deixe 0 para usar preço base)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">🐕 Pequeno (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_by_size?.small || ''}
                    onChange={(e) => handlePriceBySizeChange('small', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">🐕 Médio (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_by_size?.medium || ''}
                    onChange={(e) => handlePriceBySizeChange('medium', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">🐕 Grande (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_by_size?.large || ''}
                    onChange={(e) => handlePriceBySizeChange('large', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">🐕 Extra Grande (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_by_size?.extra_large || ''}
                    onChange={(e) => handlePriceBySizeChange('extra_large', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>O que está incluído no serviço</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newInclude}
                  onChange={(e) => setNewInclude(e.target.value)}
                  placeholder="Ex: Shampoo premium, Secagem, Corte de unhas..."
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
                  <Badge key={idx} className="bg-green-100 text-green-800 text-sm px-3 py-1">
                    ✓ {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, includes: formData.includes.filter((_, i) => i !== idx)})}
                      className="ml-2 hover:text-red-600 font-bold"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Requisitos Necessários</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Ex: Vacinas em dia, Certificado de saúde..."
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
                  <Badge key={idx} className="bg-orange-100 text-orange-800 text-sm px-3 py-1">
                    ⚠️ {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, i) => i !== idx)})}
                      className="ml-2 hover:text-red-600 font-bold"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Dias Disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'monday', label: 'Segunda' },
                  { value: 'tuesday', label: 'Terça' },
                  { value: 'wednesday', label: 'Quarta' },
                  { value: 'thursday', label: 'Quinta' },
                  { value: 'friday', label: 'Sexta' },
                  { value: 'saturday', label: 'Sábado' },
                  { value: 'sunday', label: 'Domingo' }
                ].map(day => (
                  <label key={day.value} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border hover:bg-blue-50 transition-colors">
                    <Checkbox
                      checked={(formData.available_days || []).includes(day.value)}
                      onCheckedChange={() => {
                        const days = formData.available_days || [];
                        setFormData({
                          ...formData,
                          available_days: days.includes(day.value) ? days.filter(d => d !== day.value) : [...days, day.value]
                        });
                      }}
                    />
                    <span className="text-sm font-medium">{day.label}</span>
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
                className="mb-2"
              />
              {uploadingImage && <p className="text-sm text-gray-500">Carregando imagem...</p>}
              {formData.image_url && (
                <div className="mt-3">
                  <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <Checkbox
                checked={formData.is_emergency}
                onCheckedChange={(checked) => setFormData({...formData, is_emergency: checked})}
              />
              <div className="flex-1">
                <Label className="font-bold">Serviço de Emergência (24/7)</Label>
                <p className="text-xs text-gray-600">Disponível a qualquer hora, incluindo fins de semana</p>
              </div>
              {formData.is_emergency && (
                <div className="w-32">
                  <Label className="text-xs">Taxa Extra (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.emergency_surcharge || ''}
                    onChange={(e) => handlePriceChange('emergency_surcharge', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <Checkbox
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <div className="flex-1">
                <Label className="font-bold">Serviço Ativo</Label>
                <p className="text-xs text-gray-600">Visível para clientes no site</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => { setShowServiceForm(false); setEditingService(null); }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={saveServiceMutation.isPending || uploadingImage}
            >
              {saveServiceMutation.isPending ? "A salvar..." : editingService ? '💾 Atualizar Serviço' : '✨ Criar Serviço'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
