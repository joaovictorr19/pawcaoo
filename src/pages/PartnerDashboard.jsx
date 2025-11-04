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
  Store, DollarSign, Package, Calendar,
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

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['partnerCompany', user?.email],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ company_email: user?.email });
      return companies[0] || null;
    },
    enabled: !!user,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['partnerServices', company?.id],
    queryFn: () => base44.entities.PartnerService.filter({ partner_id: company?.id }),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['serviceBookings', company?.id],
    queryFn: () => base44.entities.ServiceBooking.filter({ partner_id: company?.id }, '-created_date'),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: myAnnouncements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['myAnnouncements', company?.id],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({ company_id: company?.id }, '-created_date'),
    enabled: !!company?.id,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const saveServiceMutation = useMutation({
    mutationFn: async (data) => {
      if (!company?.id) {
        throw new Error("Empresa não encontrada");
      }

      if (editingService) {
        return await base44.entities.PartnerService.update(editingService.id, {
          pending_changes: data,
          moderation_status: 'pending',
          last_edit_date: new Date().toISOString()
        });
      }

      return await base44.entities.PartnerService.create({
        ...data,
        partner_id: company.id,
        partner_name: company.company_name,
        moderation_status: 'approved'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerServices']);
      setShowServiceForm(false);
      setEditingService(null);
      toast.success(editingService ? "Alterações enviadas para aprovação" : "Serviço criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar serviço");
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId) => base44.entities.PartnerService.delete(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerServices']);
      toast.success("Serviço removido");
    },
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      if (!company?.id) {
        throw new Error("Empresa não encontrada");
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
      toast.success(editingAnnouncement ? "Alterações enviadas para aprovação" : "Anúncio enviado para aprovação");
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myAnnouncements']);
      toast.success("Anúncio removido");
    },
  });

  // Loading state
  if (loadingUser || loadingCompany) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user || user.account_type !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Apenas empresas parceiras podem acessar esta página.</p>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analytics
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  });

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return bookingDate.getMonth() === lastMonth.getMonth() && bookingDate.getFullYear() === lastMonth.getFullYear();
  });

  const currentMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const revenueChange = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : (currentMonthRevenue > 0 ? 100 : 0);

  const bookingsChange = lastMonthBookings.length > 0
    ? ((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length * 100).toFixed(1)
    : (thisMonthBookings.length > 0 ? 100 : 0);

  const activeServices = services.filter(s => s.moderation_status === 'approved' && s.is_active);
  const pendingApprovalServices = services.filter(s => s.moderation_status === 'pending');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

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
      label: "Pendentes",
      color: "bg-orange-600",
      change: `${completedBookings.length} completados`
    },
  ];

  function ServiceForm() {
    const initialData = editingService || {
      service_name: "",
      service_type: "bath",
      description: "",
      duration_minutes: 60,
      base_price: "",
      price_by_size: { small: "", medium: "", large: "", extra_large: "" },
      includes: [],
      requirements: [],
      available_days: [],
      is_active: true,
      is_emergency: false,
      emergency_surcharge: "",
      image_url: "",
    };

    const [formData, setFormData] = useState(initialData);
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
        toast.success("Imagem carregada");
      } catch {
        toast.error("Erro ao carregar imagem");
      }
      setUploadingImage(false);
    };

    const handleSubmit = () => {
      if (!formData.service_name || !formData.description || !formData.base_price || parseFloat(formData.base_price) <= 0) {
        toast.error("Preencha Nome, Descrição e Preço Base > 0");
        return;
      }

      const cleanedData = {
        service_name: formData.service_name,
        service_type: formData.service_type,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        base_price: parseFloat(formData.base_price) || 0,
        price_by_size: {
          small: parseFloat(formData.price_by_size?.small) || 0,
          medium: parseFloat(formData.price_by_size?.medium) || 0,
          large: parseFloat(formData.price_by_size?.large) || 0,
          extra_large: parseFloat(formData.price_by_size?.extra_large) || 0,
        },
        includes: formData.includes || [],
        requirements: formData.requirements || [],
        available_days: formData.available_days || [],
        is_active: formData.is_active,
        is_emergency: formData.is_emergency,
        emergency_surcharge: parseFloat(formData.emergency_surcharge) || 0,
        image_url: formData.image_url || "",
      };

      saveServiceMutation.mutate(cleanedData);
    };

    return (
      <Card className="bg-blue-50 border-2 border-blue-200 mb-4">
        <CardContent className="p-4">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            {editingService ? <><Edit className="w-4 h-4" /> Editar Serviço</> : <><PlusCircle className="w-4 h-4" /> Criar Novo Serviço</>}
          </h3>

          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Nome do Serviço *</Label>
                <Input
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  placeholder="Ex: Banho Completo"
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Tipo *</Label>
                <Select value={formData.service_type} onValueChange={(v) => setFormData({...formData, service_type: v})}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bath">Banho</SelectItem>
                    <SelectItem value="grooming">Grooming</SelectItem>
                    <SelectItem value="veterinary">Veterinário</SelectItem>
                    <SelectItem value="vaccination">Vacinação</SelectItem>
                    <SelectItem value="checkup">Check-up</SelectItem>
                    <SelectItem value="surgery">Cirurgia</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                    <SelectItem value="pharmacy">Farmácia</SelectItem>
                    <SelectItem value="training">Treino</SelectItem>
                    <SelectItem value="daycare">Creche</SelectItem>
                    <SelectItem value="boarding">Hospedagem</SelectItem>
                    <SelectItem value="transport">Transporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o serviço..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Duração (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                  min="15"
                  step="15"
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Preço Base (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                  placeholder="20"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Preços por Tamanho (opcional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Pequeno</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.small}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, small: e.target.value}
                    })}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Médio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.medium}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, medium: e.target.value}
                    })}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Grande</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.large}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, large: e.target.value}
                    })}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">XL</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_by_size?.extra_large}
                    onChange={(e) => setFormData({
                      ...formData,
                      price_by_size: {...formData.price_by_size, extra_large: e.target.value}
                    })}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm">Incluído</Label>
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
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (newInclude.trim()) {
                      setFormData({...formData, includes: [...(formData.includes || []), newInclude.trim()]});
                      setNewInclude("");
                    }
                  }}
                >
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(formData.includes || []).map((item, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                    {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, includes: formData.includes.filter((_, i) => i !== idx)})}
                      className="ml-1 hover:text-red-600"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Requisitos</Label>
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
                  className="h-9 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (newRequirement.trim()) {
                      setFormData({...formData, requirements: [...(formData.requirements || []), newRequirement.trim()]});
                      setNewRequirement("");
                    }
                  }}
                >
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(formData.requirements || []).map((item, idx) => (
                  <Badge key={idx} className="bg-orange-100 text-orange-800 text-xs">
                    {item}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, requirements: formData.requirements.filter((_, i) => i !== idx)})}
                      className="ml-1 hover:text-red-600"
                    >×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Dias Disponíveis</Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-1">
                {[
                  { value: 'monday', label: 'Seg' },
                  { value: 'tuesday', label: 'Ter' },
                  { value: 'wednesday', label: 'Qua' },
                  { value: 'thursday', label: 'Qui' },
                  { value: 'friday', label: 'Sex' },
                  { value: 'saturday', label: 'Sáb' },
                  { value: 'sunday', label: 'Dom' }
                ].map(day => (
                  <label key={day.value} className="flex items-center gap-1 cursor-pointer p-2 bg-white rounded border hover:bg-blue-50 transition">
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
                    <span className="text-xs">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Imagem</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="h-9 text-sm"
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Checkbox
                checked={formData.is_emergency}
                onCheckedChange={(checked) => setFormData({...formData, is_emergency: checked})}
              />
              <div className="flex-1">
                <Label className="text-sm font-bold">Emergência 24/7</Label>
                <p className="text-xs text-gray-600">Disponível a qualquer hora</p>
              </div>
              {formData.is_emergency && (
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.emergency_surcharge}
                    onChange={(e) => setFormData({...formData, emergency_surcharge: e.target.value})}
                    placeholder="Taxa"
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Checkbox
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label className="text-sm font-bold">Serviço Ativo (visível para clientes)</Label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => { setShowServiceForm(false); setEditingService(null); }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={saveServiceMutation.isPending || uploadingImage}
            >
              {saveServiceMutation.isPending ? "A salvar..." : editingService ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function AnnouncementForm() {
    const initialData = editingAnnouncement ? {
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
      target_subscription_tier: ["free", "basic", "premium", "vip"],
      image_url: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_featured: false,
      featured_tier: "none",
      featured_payment_amount: 0,
    };

    const [formData, setFormData] = useState(initialData);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, image_url: file_url });
        toast.success("Imagem carregada");
      } catch {
        toast.error("Erro ao carregar");
      }
      setUploadingImage(false);
    };

    const handleSubmit = () => {
      if (!formData.title || !formData.message) {
        toast.error("Preencha Título e Mensagem");
        return;
      }
      saveAnnouncementMutation.mutate(formData);
    };

    const featuredPrices = { none: 0, basic: 50, premium: 150, exclusive: 500 };

    return (
      <Card className="bg-purple-50 border-2 border-purple-200 mb-4">
        <CardContent className="p-4">
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            {editingAnnouncement ? <><Edit className="w-4 h-4" /> Editar Anúncio</> : <><PlusCircle className="w-4 h-4" /> Novo Anúncio</>}
          </h3>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Desconto de Verão"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-sm">Mensagem *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Descrição da promoção"
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select value={formData.promotion_type} onValueChange={(v) => setFormData({...formData, promotion_type: v})}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="points_bonus">Bónus Pontos</SelectItem>
                    <SelectItem value="new_product">Novo Produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Desconto (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value) || 0})}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Data Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-sm">Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm">Imagem</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="h-9 text-sm"
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
              )}
            </div>

            <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
              <Label className="text-sm font-bold mb-2 block flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                Destacar (Pago)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { tier: 'none', name: 'Sem', price: 0 },
                  { tier: 'basic', name: 'Básico', price: 50 },
                  { tier: 'premium', name: 'Premium', price: 150 },
                  { tier: 'exclusive', name: 'Exclusivo', price: 500 }
                ].map(option => (
                  <label
                    key={option.tier}
                    className={`p-2 border-2 rounded cursor-pointer text-center ${
                      formData.featured_tier === option.tier ? 'border-yellow-500 bg-yellow-100' : 'border-gray-200 bg-white'
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
                      className="hidden"
                    />
                    <p className="font-bold text-xs">{option.name}</p>
                    <p className="text-yellow-700 font-bold">€{option.price}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={saveAnnouncementMutation.isPending || uploadingImage}
            >
              {saveAnnouncementMutation.isPending ? "A enviar..." : editingAnnouncement ? 'Atualizar' : 'Enviar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Parceiro</h1>
              <p className="text-xs text-gray-600">{company?.company_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                  {stat.change && (
                    <p className="text-xs text-gray-500 flex items-center">
                      {stat.change.includes('+') && <ArrowUp className="w-3 h-3 mr-1 text-green-500" />}
                      {stat.change.includes('-') && <ArrowDown className="w-3 h-3 mr-1 text-red-500" />}
                      {stat.change}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg p-1 h-10 mb-3">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="w-4 h-4 mr-1" />
              Visão
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs">
              <Package className="w-4 h-4 mr-1" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs">
              <Megaphone className="w-4 h-4 mr-1" />
              Anúncios
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">
              <Calendar className="w-4 h-4 mr-1" />
              Agend.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  Receita (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `€${value.toFixed(2)}`}/>
                    <Line type="monotone" dataKey="receita" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Agendamentos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Nenhum agendamento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="font-semibold text-xs text-gray-900 truncate">{booking.dog_name}</p>
                            <Badge className="text-xs">{booking.service_name}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{booking.owner_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.booking_date), "d MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</p>
                          <Badge className={`text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {booking.status}
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
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Serviços</h2>
              <Button
                onClick={() => { setShowServiceForm(true); setEditingService(null); }}
                className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
              >
                <PlusCircle className="w-3 h-3 mr-1" />
                Novo
              </Button>
            </div>

            {showServiceForm && <ServiceForm />}

            {services.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Nenhum serviço cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((service) => (
                  <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition">
                    {service.image_url && (
                      <img src={service.image_url} alt={service.service_name} className="w-full h-32 object-cover rounded-t-xl" />
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-sm">{service.service_name}</h3>
                        <div className="flex flex-col items-end gap-1">
                          {service.moderation_status === 'approved' && service.is_active && (
                            <Badge className="bg-green-100 text-green-800 text-xs flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                            </Badge>
                          )}
                          {service.moderation_status === 'pending' && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                      <div className="text-xl font-bold text-green-600 mb-3">€{service.base_price}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => {
                            setEditingService(service);
                            setShowServiceForm(true);
                          }}
                          disabled={service.moderation_status === 'pending'}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {service.moderation_status === 'pending' ? 'Análise' : 'Editar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 h-8"
                          onClick={() => {
                            if (confirm('Remover este serviço?')) {
                              deleteServiceMutation.mutate(service.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Anúncios</h2>
              <Button
                onClick={() => { setShowAnnouncementForm(true); setEditingAnnouncement(null); }}
                className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
              >
                <PlusCircle className="w-3 h-3 mr-1" />
                Novo
              </Button>
            </div>

            {showAnnouncementForm && <AnnouncementForm />}

            {myAnnouncements.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Nenhum anúncio criado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className={`border-2 ${
                    announcement.moderation_status === 'approved' ? 'border-green-200 bg-green-50' :
                    announcement.moderation_status === 'rejected' ? 'border-red-200 bg-red-50' :
                    'border-orange-200 bg-orange-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-base">{announcement.title}</h3>
                        <Badge className={`text-xs flex items-center ${
                          announcement.moderation_status === 'approved' ? 'bg-green-600' :
                          announcement.moderation_status === 'rejected' ? 'bg-red-600' :
                          'bg-orange-600'
                        }`}>
                          {announcement.moderation_status === 'approved' ? <><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</> :
                           announcement.moderation_status === 'rejected' ? <><AlertTriangle className="w-3 h-3 mr-1" /> Rejeitado</> :
                           <><Clock className="w-3 h-3 mr-1" /> Pendente</>}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{announcement.message}</p>

                      {announcement.moderation_status === 'rejected' && announcement.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                          <p className="text-xs font-bold text-red-900">Motivo:</p>
                          <p className="text-xs text-red-700">{announcement.rejection_reason}</p>
                        </div>
                      )}

                      <div className="flex gap-1 mt-2">
                        {(announcement.moderation_status === 'pending' || announcement.moderation_status === 'rejected') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setShowAnnouncementForm(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 h-7 text-xs"
                          onClick={() => {
                            if (confirm('Remover anúncio?')) {
                              deleteAnnouncementMutation.mutate(announcement.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Todos os Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Nenhum agendamento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="font-semibold text-xs truncate">{booking.dog_name}</p>
                            <Badge className="text-xs">{booking.service_name}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{booking.owner_name}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(booking.booking_date), "d MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold text-green-600">€{booking.total_amount?.toFixed(2)}</p>
                          <Badge className={`text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {booking.status}
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
}