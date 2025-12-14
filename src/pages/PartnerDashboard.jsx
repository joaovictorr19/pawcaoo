import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, Package, Megaphone, CheckCircle, Clock,
  Plus, Trash, Eye, Calendar, AlertCircle, X, Upload, ShoppingBag, BarChart3, Users
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PartnerAnalytics from "../components/partner/PartnerAnalytics";
import Pagination from "../components/ui/Pagination";
import LazyImage from "../components/ui/LazyImage";
import EmployeeManager from "../components/company/EmployeeManager";
import CompanyMessaging from "../components/company/CompanyMessaging";
import CompanyNotificationFeed from "../components/company/CompanyNotificationFeed";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showMyServices, setShowMyServices] = useState(false);
  const [showMyProducts, setShowMyProducts] = useState(false);
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [servicesPerPage, setServicesPerPage] = useState(10);
  
  const [productForm, setProductForm] = useState({
    product_name: "",
    category: "food",
    description: "",
    price_euro: "",
    points_cost: "",
    stock_quantity: "",
    image_url: "",
    discount_percentage: ""
  });
  
  const [serviceForm, setServiceForm] = useState({
    service_name: "",
    service_type: "bath",
    description: "",
    duration_minutes: 60,
    base_price: "",
    image_url: "",
    location: "",
    address: ""
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    promotion_type: "discount",
    discount_percentage: "",
    start_date: "",
    end_date: "",
    image_url: ""
  });

  const [companyProfileForm, setCompanyProfileForm] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company } = useQuery({
    queryKey: ['myCompany'],
    queryFn: async () => {
      if (!user?.email) return null;
      const companies = await base44.entities.PartnerCompany.filter({
        company_email: user.email
      });
      return companies[0] || null;
    },
    enabled: !!user,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data) => {
      if (!company?.id) return;
      // Clean up array strings if they are comma separated strings
      const payload = { ...data };
      if (typeof payload.services_offered === 'string') {
        payload.services_offered = payload.services_offered.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (typeof payload.service_areas === 'string') {
        payload.service_areas = payload.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      await base44.entities.PartnerCompany.update(company.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myCompany']);
      toast.success("Perfil da empresa atualizado!");
      setShowEditProfile(false);
    }
  });

  const { data: myProducts = [] } = useQuery({
    queryKey: ['myProducts', user?.email],
    queryFn: async () => {
      if (!user?.email || !company?.id) return [];
      const all = await base44.entities.PartnerProduct.list();
      
      const mine = all.filter(p => p.created_by === user.email || p.partner_id === company.id);
      return mine;
    },
    enabled: !!user?.email && !!company?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Paginated products
  const paginatedProducts = React.useMemo(() => {
    const startIndex = (productsPage - 1) * productsPerPage;
    return myProducts.slice(startIndex, startIndex + productsPerPage);
  }, [myProducts, productsPage, productsPerPage]);

  const totalProductPages = Math.ceil(myProducts.length / productsPerPage);

  const { data: myServices = [] } = useQuery({
    queryKey: ['myServices', user?.email],
    queryFn: async () => {
      if (!user?.email || !company?.id) return [];
      const all = await base44.entities.PartnerService.list();
      
      const mine = all.filter(s => 
        s.partner_company_email === user.email || 
        s.created_by === user.email
      );
      return mine;
    },
    enabled: !!user?.email && !!company?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Paginated services
  const paginatedServices = React.useMemo(() => {
    const startIndex = (servicesPage - 1) * servicesPerPage;
    return myServices.slice(startIndex, startIndex + servicesPerPage);
  }, [myServices, servicesPage, servicesPerPage]);

  const totalServicePages = Math.ceil(myServices.length / servicesPerPage);

  const { data: myAnnouncements = [] } = useQuery({
    queryKey: ['myAnnouncements', user?.email],
    queryFn: async () => {
      if (!user?.email || !company?.id) return [];

      const all = await base44.entities.CompanyAnnouncement.list();
      
      console.log('📢 MEUS ANÚNCIOS - DEBUG:');
      console.log('Total DB:', all.length);
      console.log('Meu email:', user.email);
      console.log('Company ID:', company.id);
      
      const mine = all.filter(a => 
        a.company_email === user.email || 
        a.company_id === company.id ||
        a.created_by === user.email
      );
      
      console.log('MEUS:', mine.length);
      mine.forEach(a => {
        console.log(`- ${a.title}: ${a.moderation_status}, active=${a.is_active}`);
      });
      
      return mine;
    },
    enabled: !!user?.email && !!company?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['partnerBookings', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const all = await base44.entities.ServiceBooking.filter({ partner_id: company.id }, '-created_date');
      return all;
    },
    enabled: !!company?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: myPayments = [] } = useQuery({
    queryKey: ['partnerPayments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const all = await base44.entities.Payment.filter({ recipient_email: user.email }, '-held_date');
      return all;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        price_euro: parseFloat(data.price_euro) || 0,
        points_cost: parseInt(data.points_cost) || 0,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        discount_percentage: parseInt(data.discount_percentage) || 0,
        partner_id: company.id,
        partner_name: company.company_name,
        partner_company_email: user.email,
        is_available: false,
        moderation_status: 'pending'
      };
      
      console.log('🚀 CRIANDO PRODUTO:', payload);
      const result = await base44.entities.PartnerProduct.create(payload);
      console.log('✅ PRODUTO CRIADO:', result);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProducts']);
      queryClient.invalidateQueries(['shopProducts']);
      queryClient.invalidateQueries(['allPartnerProducts']);
      toast.success('✅ Produto enviado para aprovação!');
      setShowCreateProduct(false);
      setProductForm({
        product_name: "",
        category: "food",
        description: "",
        price_euro: "",
        points_cost: "",
        stock_quantity: "",
        image_url: "",
        discount_percentage: ""
      });
    },
    onError: (error) => {
      console.error('❌ ERRO AO CRIAR PRODUTO:', error);
      toast.error('Erro: ' + error.message);
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        base_price: parseFloat(data.base_price) || 0,
        partner_id: company.id,
        partner_name: company.company_name,
        partner_company_email: user.email,
        created_by: user.email,
        moderation_status: 'approved',
        is_active: true
      };

      console.log('🚀 CRIANDO SERVIÇO:', payload);
      
      const result = await base44.entities.PartnerService.create(payload);
      
      console.log('✅ SERVIÇO CRIADO:', result);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      queryClient.invalidateQueries(['partnerServices']);
      queryClient.refetchQueries(['partnerServices']);
      
      toast.success('✅ Serviço criado!');
      setShowCreateService(false);
      setServiceForm({
        service_name: "",
        service_type: "bath",
        description: "",
        duration_minutes: 60,
        base_price: "",
        image_url: "",
        location: "",
        address: ""
      });
    },
    onError: (error) => {
      console.error('❌ ERRO:', error);
      toast.error('Erro: ' + error.message);
    }
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        discount_percentage: parseInt(data.discount_percentage) || 0,
        company_id: company.id,
        company_name: company.company_name,
        company_email: user.email,
        created_by: user.email,
        moderation_status: 'approved',
        is_active: true
      };

      console.log('🚀 CRIANDO ANÚNCIO:', payload);
      
      const result = await base44.entities.CompanyAnnouncement.create(payload);
      
      console.log('✅ ANÚNCIO CRIADO:', result);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAnnouncements']);
      queryClient.invalidateQueries(['activeAnnouncements']);
      queryClient.refetchQueries(['activeAnnouncements']);
      
      toast.success('✅ Anúncio criado e ATIVO!');
      setShowCreateAnnouncement(false);
      setAnnouncementForm({
        title: "",
        message: "",
        promotion_type: "discount",
        discount_percentage: "",
        start_date: "",
        end_date: "",
        image_url: ""
      });
    },
    onError: (error) => {
      console.error('❌ ERRO:', error);
      toast.error('Erro: ' + error.message);
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      toast.success('✅ Imagem carregada!');
    },
    onError: () => {
      toast.error('❌ Erro ao carregar imagem');
    }
  });

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel max-w-md border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Empresa não encontrada</h2>
            <p className="text-gray-600 mb-4">Email: {user?.email}</p>
            <Button onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Painel de Parceiro
          </h1>
          <p className="text-lg text-gray-600">{company.company_name}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setCompanyProfileForm({
                ...company,
                services_offered: company.services_offered ? company.services_offered.join(', ') : "",
                service_areas: company.service_areas ? company.service_areas.join(', ') : "",
                business_hours: company.business_hours || {
                  monday: "9:00 - 18:00", tuesday: "9:00 - 18:00", wednesday: "9:00 - 18:00",
                  thursday: "9:00 - 18:00", friday: "9:00 - 18:00", saturday: "10:00 - 14:00", sunday: "Closed"
                }
              });
              setShowEditProfile(true);
            }}
          >
            Editar Perfil da Empresa
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-3xl">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Equipa
            </TabsTrigger>
            <TabsTrigger value="communication">
              <Megaphone className="w-4 h-4 mr-2" />
              Comunicação
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* BOTÕES RÁPIDOS */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
              <Button
                onClick={() => setShowCreateService(true)}
                className="bg-blue-600 hover:bg-blue-700 h-16"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Serviço
              </Button>
              <Button
                onClick={() => setShowCreateProduct(true)}
                className="bg-green-600 hover:bg-green-700 h-16"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Produto
              </Button>
              <Button
                onClick={() => setShowCreateAnnouncement(true)}
                className="bg-purple-600 hover:bg-purple-700 h-16"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Anúncio
              </Button>
              <Button
                onClick={() => setShowMyServices(true)}
                variant="outline"
                className="h-16 border-blue-300"
              >
                <Package className="w-5 h-5 mr-2" />
                Meus Serviços ({myServices.length})
              </Button>
              <Button
                onClick={() => setShowMyAnnouncements(true)}
                variant="outline"
                className="h-16 border-purple-300"
              >
                <Megaphone className="w-5 h-5 mr-2" />
                Meus Anúncios ({myAnnouncements.length})
              </Button>
              <Button
                onClick={() => setShowMyProducts(true)}
                variant="outline"
                className="h-16 border-green-300"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Meus Produtos ({myProducts.length})
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <EmployeeManager company={company} />
          </TabsContent>

          <TabsContent value="communication">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompanyNotificationFeed companyId={company.id} companyEmail={company.company_email} />
              <CompanyMessaging companyId={company.id} companyEmail={company.company_email} />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <PartnerAnalytics 
              bookings={myBookings}
              products={myProducts}
              services={myServices}
              payments={myPayments}
              companyId={company?.id}
            />
          </TabsContent>
        </Tabs>

      </div>

      {/* CRIAR SERVIÇO - COM FOTO E LOCALIZAÇÃO */}
      <Dialog open={showCreateService} onOpenChange={setShowCreateService}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* FOTO DO SERVIÇO */}
            <div>
              <Label>Foto do Serviço</Label>
              {serviceForm.image_url && (
                <div className="relative w-full h-48 mb-2">
                  <img 
                    src={serviceForm.image_url} 
                    className="w-full h-full object-cover rounded-lg" 
                    alt="Serviço"
                  />
                  <button
                    type="button"
                    onClick={() => setServiceForm({...serviceForm, image_url: ""})}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const url = await uploadImageMutation.mutateAsync(file);
                      setServiceForm({...serviceForm, image_url: url});
                    } catch (error) {
                      console.error('Error uploading:', error);
                    }
                  }
                }}
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Foto do serviço ajuda a atrair mais clientes
              </p>
            </div>

            <div>
              <Label>Nome do Serviço *</Label>
              <Input
                value={serviceForm.service_name}
                onChange={(e) => setServiceForm({...serviceForm, service_name: e.target.value})}
                placeholder="Banho Completo"
                className="bg-white text-gray-900"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={serviceForm.service_type}
                onValueChange={(v) => setServiceForm({...serviceForm, service_type: v})}
              >
                <SelectTrigger className="bg-white text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bath">🛁 Banho</SelectItem>
                  <SelectItem value="grooming">✂️ Grooming</SelectItem>
                  <SelectItem value="veterinary">🏥 Veterinário</SelectItem>
                  <SelectItem value="vaccination">💉 Vacinação</SelectItem>
                  <SelectItem value="checkup">🩺 Check-up</SelectItem>
                  <SelectItem value="emergency">🚨 Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                rows={3}
                placeholder="Descreva o serviço em detalhes..."
                className="bg-white text-gray-900"
              />
            </div>

            {/* LOCALIZAÇÃO */}
            <div>
              <Label>Cidade/Localização *</Label>
              <Input
                value={serviceForm.location}
                onChange={(e) => setServiceForm({...serviceForm, location: e.target.value})}
                placeholder="Lisboa"
                className="bg-white text-gray-900"
              />
            </div>

            <div>
              <Label>Morada Completa</Label>
              <Input
                value={serviceForm.address}
                onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                placeholder="Rua Principal, 123"
                className="bg-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({...serviceForm, duration_minutes: e.target.value})}
                  className="bg-white text-gray-900"
                />
              </div>
              <div>
                <Label>Preço (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({...serviceForm, base_price: e.target.value})}
                  placeholder="25.00"
                  className="bg-white text-gray-900"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!serviceForm.service_name || !serviceForm.base_price || !serviceForm.location) {
                  toast.error('Preencha nome, preço e localização!');
                  return;
                }
                createServiceMutation.mutate(serviceForm);
              }}
              disabled={createServiceMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              {createServiceMutation.isPending ? 'Criando...' : 'Criar Serviço'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CRIAR ANÚNCIO - COM FOTO */}
      <Dialog open={showCreateAnnouncement} onOpenChange={setShowCreateAnnouncement}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* FOTO DO ANÚNCIO */}
            <div>
              <Label>Imagem do Anúncio *</Label>
              {announcementForm.image_url && (
                <div className="relative w-full h-48 mb-2">
                  <img 
                    src={announcementForm.image_url} 
                    className="w-full h-full object-cover rounded-lg" 
                    alt="Anúncio"
                  />
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({...announcementForm, image_url: ""})}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      const url = await uploadImageMutation.mutateAsync(file);
                      setAnnouncementForm({...announcementForm, image_url: url});
                    } catch (error) {
                      console.error('Error:', error);
                    }
                  }
                }}
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Imagem chamativa aumenta cliques (recomendado: 1200x630px)
              </p>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                placeholder="Super Promoção!"
                className="bg-white text-gray-900"
              />
            </div>

            <div>
              <Label>Mensagem *</Label>
              <Textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                rows={4}
                placeholder="Descreva a promoção..."
                className="bg-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  value={announcementForm.discount_percentage}
                  onChange={(e) => setAnnouncementForm({...announcementForm, discount_percentage: e.target.value})}
                  placeholder="10"
                  className="bg-white text-gray-900"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={announcementForm.promotion_type}
                  onValueChange={(v) => setAnnouncementForm({...announcementForm, promotion_type: v})}
                >
                  <SelectTrigger className="bg-white text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">🏷️ Desconto</SelectItem>
                    <SelectItem value="flash_sale">⚡ Flash Sale</SelectItem>
                    <SelectItem value="new_product">🆕 Novo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={announcementForm.start_date}
                  onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value})}
                  className="bg-white text-gray-900"
                />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={announcementForm.end_date}
                  onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                  className="bg-white text-gray-900"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!announcementForm.title || !announcementForm.message || !announcementForm.start_date || !announcementForm.end_date || !announcementForm.image_url) {
                  toast.error('Preencha título, mensagem, datas e adicione uma imagem!');
                  return;
                }
                createAnnouncementMutation.mutate(announcementForm);
              }}
              disabled={createAnnouncementMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12"
            >
              {createAnnouncementMutation.isPending ? 'Criando...' : 'Criar Anúncio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CRIAR PRODUTO */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Produto para a Loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Imagem do Produto *</Label>
              {productForm.image_url && (
                <div className="relative w-full h-48 mb-2">
                  <img src={productForm.image_url} className="w-full h-full object-cover rounded-lg" alt="Produto" />
                  <button
                    type="button"
                    onClick={() => setProductForm({...productForm, image_url: ""})}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = await uploadImageMutation.mutateAsync(file);
                    setProductForm({...productForm, image_url: url});
                  }
                }}
              />
            </div>

            <div>
              <Label>Nome do Produto *</Label>
              <Input
                value={productForm.product_name}
                onChange={(e) => setProductForm({...productForm, product_name: e.target.value})}
                placeholder="Ração Premium 15kg"
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select value={productForm.category} onValueChange={(v) => setProductForm({...productForm, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">🍖 Comida</SelectItem>
                  <SelectItem value="toys">🎾 Brinquedos</SelectItem>
                  <SelectItem value="accessories">🎀 Acessórios</SelectItem>
                  <SelectItem value="grooming">✂️ Grooming</SelectItem>
                  <SelectItem value="health">💊 Saúde</SelectItem>
                  <SelectItem value="training">🎓 Treino</SelectItem>
                  <SelectItem value="other">📦 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                rows={3}
                placeholder="Descreva o produto..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Preço (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price_euro}
                  onChange={(e) => setProductForm({...productForm, price_euro: e.target.value})}
                  placeholder="29.99"
                />
              </div>
              <div>
                <Label>Custo em Pontos</Label>
                <Input
                  type="number"
                  value={productForm.points_cost}
                  onChange={(e) => setProductForm({...productForm, points_cost: e.target.value})}
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                value={productForm.discount_percentage}
                onChange={(e) => setProductForm({...productForm, discount_percentage: e.target.value})}
                placeholder="10"
              />
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Aprovação Necessária:</strong> Produtos são revisados por admins antes de aparecerem na loja.
              </p>
            </div>

            <Button
              onClick={() => {
                if (!productForm.product_name || !productForm.price_euro || !productForm.image_url) {
                  toast.error('Preencha nome, preço e adicione uma imagem!');
                  return;
                }
                createProductMutation.mutate(productForm);
              }}
              disabled={createProductMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              {createProductMutation.isPending ? 'Enviando...' : 'Enviar para Aprovação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MEUS SERVIÇOS */}
      <Dialog open={showMyServices} onOpenChange={setShowMyServices}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meus Serviços ({myServices.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myServices.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum serviço criado</p>
              </div>
            ) : (
              <>
              {paginatedServices.map(service => (
                <Card key={service.id} className="border-2 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{service.service_name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={service.moderation_status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}>
                            {service.moderation_status}
                          </Badge>
                          <Badge variant="outline">
                            {service.is_active ? '🟢 Ativo' : '🔴 Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">€{service.base_price}</p>
                        <p className="text-xs text-gray-500">{service.duration_minutes}min</p>
                      </div>
                    </div>
                    </CardContent>
                    </Card>
                    ))}

                    {myServices.length > 0 && (
                    <Pagination
                    currentPage={servicesPage}
                    totalPages={totalServicePages}
                    onPageChange={setServicesPage}
                    itemsPerPage={servicesPerPage}
                    totalItems={myServices.length}
                    onItemsPerPageChange={(value) => {
                    setServicesPerPage(value);
                    setServicesPage(1);
                    }}
                    />
                    )}
                    </>
                    )}
                    </div>
                    </DialogContent>
                    </Dialog>

                    {/* EDIT COMPANY PROFILE */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil da Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Serviços Oferecidos (Resumo)</Label>
                <Input 
                  value={companyProfileForm.services_offered} 
                  onChange={(e) => setCompanyProfileForm({...companyProfileForm, services_offered: e.target.value})}
                  placeholder="Banho, Tosa, Veterinário (separados por vírgula)"
                />
              </div>
              <div>
                <Label>Áreas de Atendimento</Label>
                <Input 
                  value={companyProfileForm.service_areas} 
                  onChange={(e) => setCompanyProfileForm({...companyProfileForm, service_areas: e.target.value})}
                  placeholder="Lisboa, Porto, Cascais (separados por vírgula)"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Horário de Funcionamento</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day}>
                    <Label className="text-xs capitalize">{day}</Label>
                    <Input 
                      value={companyProfileForm.business_hours?.[day] || ""} 
                      onChange={(e) => setCompanyProfileForm({
                        ...companyProfileForm, 
                        business_hours: { ...companyProfileForm.business_hours, [day]: e.target.value }
                      })}
                      className="h-8 text-xs"
                      placeholder="9:00 - 18:00"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Website</Label>
              <Input 
                value={companyProfileForm.website || ""} 
                onChange={(e) => setCompanyProfileForm({...companyProfileForm, website: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Telefone</Label>
              <Input 
                value={companyProfileForm.phone || ""} 
                onChange={(e) => setCompanyProfileForm({...companyProfileForm, phone: e.target.value})}
              />
            </div>

            <Button 
              onClick={() => updateCompanyMutation.mutate(companyProfileForm)}
              disabled={updateCompanyMutation.isPending}
              className="w-full bg-blue-600"
            >
              {updateCompanyMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MEUS PRODUTOS */}
      <Dialog open={showMyProducts} onOpenChange={setShowMyProducts}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meus Produtos ({myProducts.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum produto criado</p>
              </div>
            ) : (
              <>
              {paginatedProducts.map(product => (
                <Card key={product.id} className={`border-2 ${
                  product.moderation_status === 'pending' ? 'border-orange-200 bg-orange-50' :
                  product.moderation_status === 'approved' ? 'border-green-200 bg-green-50' :
                  'border-red-200 bg-red-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {product.image_url && (
                        <LazyImage
                          src={product.image_url} 
                          className="w-24 h-24 object-cover rounded-lg" 
                          alt={product.product_name}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{product.product_name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={
                            product.moderation_status === 'pending' ? 'bg-orange-500' :
                            product.moderation_status === 'approved' ? 'bg-green-600' :
                            'bg-red-600'
                          }>
                            {product.moderation_status === 'pending' ? '⏳ Em Análise' :
                             product.moderation_status === 'approved' ? '✅ Aprovado' :
                             '❌ Rejeitado'}
                          </Badge>
                          <Badge variant="outline">
                            {product.is_available ? '🟢 Visível' : '🔴 Oculto'}
                          </Badge>
                          <Badge className="bg-indigo-600 text-white">€{product.price_euro}</Badge>
                          {product.points_cost > 0 && (
                            <Badge variant="outline">{product.points_cost} pts</Badge>
                          )}
                          <Badge variant="outline" className="capitalize">{product.category}</Badge>
                        </div>
                        {product.rejection_reason && (
                          <p className="text-xs text-red-600 mt-2">
                            <strong>Motivo:</strong> {product.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Stock: {product.stock_quantity || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {myProducts.length > 0 && (
              <Pagination
                currentPage={productsPage}
                totalPages={totalProductPages}
                onPageChange={setProductsPage}
                itemsPerPage={productsPerPage}
                totalItems={myProducts.length}
                onItemsPerPageChange={(value) => {
                  setProductsPerPage(value);
                  setProductsPage(1);
                }}
              />
            )}
            </>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MEUS ANÚNCIOS */}
      <Dialog open={showMyAnnouncements} onOpenChange={setShowMyAnnouncements}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meus Anúncios ({myAnnouncements.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {myAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum anúncio criado</p>
              </div>
            ) : (
              myAnnouncements.map(announcement => (
                <Card key={announcement.id} className="border-2 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {announcement.image_url && (
                        <img 
                          src={announcement.image_url} 
                          className="w-24 h-24 object-cover rounded-lg" 
                          alt="Announcement"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{announcement.message}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={announcement.moderation_status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}>
                            {announcement.moderation_status}
                          </Badge>
                          <Badge variant="outline">
                            {announcement.is_active ? '🟢 Ativo' : '🔴 Inativo'}
                          </Badge>
                          {announcement.discount_percentage > 0 && (
                            <Badge className="bg-red-500 text-white">
                              -{announcement.discount_percentage}%
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {announcement.start_date?.split('T')[0]} → {announcement.end_date?.split('T')[0]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}