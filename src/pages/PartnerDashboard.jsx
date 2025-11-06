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
  Plus, Trash, Eye, Calendar, AlertCircle, X, Upload
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showMyServices, setShowMyServices] = useState(false);
  const [showMyAnnouncements, setShowMyAnnouncements] = useState(false);
  
  const [serviceForm, setServiceForm] = useState({
    service_name: "",
    service_type: "bath",
    description: "",
    duration_minutes: 60,
    base_price: "",
    image_url: ""
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

  const { data: myServices = [] } = useQuery({
    queryKey: ['myServices', user?.email],
    queryFn: async () => {
      if (!user?.email || !company?.id) return [];

      const all = await base44.entities.PartnerService.list();
      
      console.log('🔧 MEUS SERVIÇOS - DEBUG:');
      console.log('Total DB:', all.length);
      console.log('Meu email:', user.email);
      console.log('Company ID:', company.id);
      
      const mine = all.filter(s => 
        s.partner_company_email === user.email || 
        s.created_by === user.email
      );
      
      console.log('MEUS:', mine.length);
      mine.forEach(s => {
        console.log(`- ${s.service_name}: ${s.moderation_status}, active=${s.is_active}`);
      });
      
      return mine;
    },
    enabled: !!user?.email && !!company?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

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
        image_url: ""
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
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Painel de Parceiro
          </h1>
          <p className="text-lg text-gray-600">{company.company_name}</p>
        </div>

        {/* BOTÕES RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Button
            onClick={() => setShowCreateService(true)}
            className="bg-blue-600 hover:bg-blue-700 h-16"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Serviço
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
        </div>
      </div>

      {/* CRIAR SERVIÇO */}
      <Dialog open={showCreateService} onOpenChange={setShowCreateService}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Serviço *</Label>
              <Input
                value={serviceForm.service_name}
                onChange={(e) => setServiceForm({...serviceForm, service_name: e.target.value})}
                placeholder="Banho Completo"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select
                value={serviceForm.service_type}
                onValueChange={(v) => setServiceForm({...serviceForm, service_type: v})}
              >
                <SelectTrigger>
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({...serviceForm, duration_minutes: e.target.value})}
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
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!serviceForm.service_name || !serviceForm.base_price) {
                  toast.error('Preencha nome e preço!');
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

      {/* CRIAR ANÚNCIO */}
      <Dialog open={showCreateAnnouncement} onOpenChange={setShowCreateAnnouncement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Anúncio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                placeholder="Super Promoção!"
              />
            </div>

            <div>
              <Label>Mensagem *</Label>
              <Textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                rows={4}
                placeholder="Descreva a promoção..."
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
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={announcementForm.promotion_type}
                  onValueChange={(v) => setAnnouncementForm({...announcementForm, promotion_type: v})}
                >
                  <SelectTrigger>
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
                />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={announcementForm.end_date}
                  onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Imagem</Label>
              {announcementForm.image_url && (
                <img src={announcementForm.image_url} className="w-full h-32 object-cover rounded-lg mb-2" />
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
                      toast.success('Imagem carregada!');
                    } catch (error) {
                      toast.error('Erro ao carregar imagem');
                    }
                  }
                }}
              />
            </div>

            <Button
              onClick={() => {
                if (!announcementForm.title || !announcementForm.start_date || !announcementForm.end_date) {
                  toast.error('Preencha título e datas!');
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
              myServices.map(service => (
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
              ))
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