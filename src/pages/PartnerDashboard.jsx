
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
import { 
  Store, Package, TrendingUp, DollarSign, Plus, 
  Edit, Trash2, Megaphone, BarChart3, ShoppingBag, 
  Users, UserPlus, Mail, Phone, Calendar, Crown, Eye, MousePointer, Upload
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Para admin: listar todas as empresas
  const { data: allCompanies } = useQuery({
    queryKey: ['allPartnerCompanies'],
    queryFn: () => base44.entities.PartnerCompany.list(),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  // Para empresa: buscar a própria empresa
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['partnerCompany', user?.role, selectedCompany?.id], // Add selectedCompany.id to queryKey for admin mode
    queryFn: async () => {
      if (user?.role === 'admin' && selectedCompany) {
        return selectedCompany;
      }
      if (!user) return null; // Avoid running if user is not loaded
      const companies = await base44.entities.PartnerCompany.filter({ 
        company_email: user?.email 
      });
      return companies[0];
    },
    enabled: !!user && (user?.role === 'admin' ? !!selectedCompany : true), // Enable if user is loaded, for admin only if selectedCompany is set
  });

  const { data: products } = useQuery({
    queryKey: ['companyProducts', company?.id], // Add company?.id to invalidate on company change
    queryFn: () => base44.entities.PartnerProduct.filter({ 
      partner_id: company?.partnership_id 
    }),
    enabled: !!company,
    initialData: [],
  });

  const { data: employees } = useQuery({
    queryKey: ['companyEmployees', company?.id], // Add company?.id
    queryFn: () => base44.entities.CompanyEmployee.filter({ 
      company_id: company?.id 
    }),
    enabled: !!company,
    initialData: [],
  });

  const { data: announcements } = useQuery({
    queryKey: ['companyAnnouncements', company?.id], // Add company?.id
    queryFn: () => base44.entities.CompanyAnnouncement.filter({ 
      company_id: company?.id 
    }, '-created_date'),
    enabled: !!company,
    initialData: [],
  });

  const { data: redemptions } = useQuery({
    queryKey: ['companyRedemptions', company?.id], // Add company?.id
    queryFn: async () => {
      const allRedemptions = await base44.entities.Redemption.list('-created_date');
      return allRedemptions.filter(r => r.partner_id === company?.partnership_id);
    },
    enabled: !!company,
    initialData: [],
  });

  const saveProductMutation = useMutation({
    mutationFn: async (productData) => {
      if (editingProduct) {
        return await base44.entities.PartnerProduct.update(editingProduct.id, productData);
      } else {
        return await base44.entities.PartnerProduct.create({
          ...productData,
          partner_id: company.partnership_id,
          partner_name: company.company_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProducts'] });
      toast.success(editingProduct ? "Produto atualizado!" : "Produto adicionado!");
      setShowProductForm(false);
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProducts'] });
      toast.success("Produto eliminado!");
    },
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: async (announcementData) => {
      if (editingAnnouncement) {
        return await base44.entities.CompanyAnnouncement.update(editingAnnouncement.id, announcementData);
      } else {
        return await base44.entities.CompanyAnnouncement.create({
          ...announcementData,
          company_id: company.id,
          company_name: company.company_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAnnouncements'] });
      toast.success(editingAnnouncement ? "Anúncio atualizado!" : "Anúncio criado!");
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAnnouncements'] });
      toast.success("Anúncio eliminado!");
    },
  });

  const saveEmployeeMutation = useMutation({
    mutationFn: async (employeeData) => {
      if (editingEmployee) {
        return await base44.entities.CompanyEmployee.update(editingEmployee.id, employeeData);
      } else {
        return await base44.entities.CompanyEmployee.create({
          ...employeeData,
          company_id: company.id,
          company_name: company.company_name
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyEmployees'] });
      toast.success(editingEmployee ? "Funcionário atualizado!" : "Funcionário adicionado!");
      setShowEmployeeForm(false);
      setEditingEmployee(null);
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyEmployee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyEmployees'] });
      toast.success("Funcionário removido!");
    },
  });

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  // Admin sem empresa selecionada - mostrar lista de empresas
  if (user?.role === 'admin' && !selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Store className="w-10 h-10 text-green-600" />
              Painel de Empresas Parceiras - Admin
            </h1>
            <p className="text-gray-600 text-lg">Selecione uma empresa para gerir</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {allCompanies.map((comp) => (
              <Card 
                key={comp.id} 
                className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => setSelectedCompany(comp)}
              >
                <CardContent className="p-6">
                  {comp.logo_url && (
                    <img src={comp.logo_url} alt={comp.company_name} className="w-full h-32 object-contain mb-4" />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{comp.company_name}</h3>
                  <Badge className="mb-2">{comp.company_type}</Badge>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                    <div>
                      <p className="text-gray-500">Produtos</p>
                      <p className="font-bold">{comp.total_products || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vendas</p>
                      <p className="font-bold">€{(comp.total_sales || 0).toFixed(0)}</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => setSelectedCompany(comp)}>
                    Gerir Empresa
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empresa sem acesso
  if (!company && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sem Acesso de Empresa</h2>
            <p className="text-gray-600 mb-4">
              Não tem acesso de empresa parceira. Contacte o admin do PawCão para configurar a sua conta de empresa.
            </p>
            <Button onClick={() => window.location.href = 'mailto:partners@pawcao.com'}>
              Contactar Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_available).length,
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.is_active).length,
    totalSales: company?.total_sales || 0,
    totalRedemptions: redemptions.length,
    revenue: redemptions.reduce((sum, r) => sum + (r.euro_value || 0), 0),
    totalAnnouncements: announcements.length,
    featuredAnnouncements: announcements.filter(a => a.is_featured).length,
    totalViews: announcements.reduce((sum, a) => sum + (a.views_count || 0), 0),
    totalClicks: announcements.reduce((sum, a) => sum + (a.clicks_count || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Store className="w-10 h-10 text-green-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {company?.company_name} - Painel de Gestão
                </h1>
                <p className="text-gray-600 text-lg">Gira produtos, anúncios, funcionários e promoções</p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <Button variant="outline" onClick={() => setSelectedCompany(null)}>
                ← Voltar à Lista de Empresas
              </Button>
            )}
          </div>
          {user?.role === 'admin' && company && (
            <Badge className="bg-purple-600 text-white">
              Modo Admin - A gerir {company.company_name}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produtos Totais</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
                </div>
                <Package className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Anúncios Ativos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalAnnouncements}</p>
                </div>
                <Megaphone className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Visualizações</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalViews}</p>
                </div>
                <Eye className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita</p>
                  <p className="text-3xl font-bold text-orange-600">€{stats.revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="announcements">Anúncios & Promoções</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gerir Anúncios na Loja PawCão</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Crie promoções e pague para ficar em destaque</p>
                </div>
                <Button onClick={() => {
                  setEditingAnnouncement(null);
                  setShowAnnouncementForm(true);
                }} className="bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Anúncio
                </Button>
              </CardHeader>
              <CardContent>
                {showAnnouncementForm && <AnnouncementForm />}
                
                {/* Featured Pricing */}
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-600" />
                      Planos de Destaque
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h4 className="font-bold text-gray-900 mb-2">Basic</h4>
                        <p className="text-2xl font-bold text-blue-600 mb-2">€49/mês</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✓ Aparece no topo da categoria</li>
                          <li>✓ Badge "Em Destaque"</li>
                          <li>✓ 3x mais visibilidade</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow border-2 border-purple-400">
                        <Badge className="bg-purple-500 mb-2">Popular</Badge>
                        <h4 className="font-bold text-gray-900 mb-2">Premium</h4>
                        <p className="text-2xl font-bold text-purple-600 mb-2">€99/mês</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✓ Topo de TODAS as páginas</li>
                          <li>✓ Banner grande na homepage</li>
                          <li>✓ Badge "Premium Partner"</li>
                          <li>✓ 10x mais visibilidade</li>
                        </ul>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-4 rounded-lg shadow text-white">
                        <Badge className="bg-white text-orange-600 mb-2">VIP</Badge>
                        <h4 className="font-bold mb-2">Exclusive</h4>
                        <p className="text-2xl font-bold mb-2">€199/mês</p>
                        <ul className="text-sm space-y-1">
                          <li>✓ Posição #1 garantida</li>
                          <li>✓ Banner exclusivo homepage</li>
                          <li>✓ Email marketing dedicado</li>
                          <li>✓ Visibilidade máxima</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                                <Crown className="w-3 h-3 mr-1" />
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
                          </div>
                          
                          {announcement.image_url && (
                            <img src={announcement.image_url} alt="" className="w-full max-w-md h-32 object-cover rounded-lg mb-3" />
                          )}

                          <p className="text-gray-600 mb-3">{announcement.message}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Eye className="w-4 h-4" />
                                Visualizações
                              </div>
                              <p className="text-xl font-bold text-gray-900">{announcement.views_count || 0}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <MousePointer className="w-4 h-4" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Seus Produtos</CardTitle>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </CardHeader>
              <CardContent>
                {showProductForm && <ProductForm />}
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="h-48 bg-gray-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2">{product.product_name}</h3>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-bold text-green-600">€{product.price_euro}</span>
                          <Badge>{product.category}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stock: {product.stock_quantity}</span>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteProductMutation.mutate(product.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestão de Funcionários</CardTitle>
                <Button onClick={() => {
                  setEditingEmployee(null);
                  setShowEmployeeForm(true);
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </CardHeader>
              <CardContent>
                {showEmployeeForm && <EmployeeForm />}
                
                <div className="space-y-4 mt-6">
                  {employees.map((employee) => (
                    <Card key={employee.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{employee.employee_name}</h3>
                              <Badge className={employee.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                {employee.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {employee.employee_email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {employee.employee_phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-PT') : 'N/A'}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Badge>{employee.employee_type === 'walker' ? 'Passeador' : employee.employee_type === 'trainer' ? 'Treinador' : 'Ambos'}</Badge>
                            <Badge className="bg-blue-100 text-blue-700">
                              €{employee.hourly_rate}/hora
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700">
                              {employee.commission_split}% comissão
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-500">Total de Reservas</p>
                              <p className="text-xl font-bold text-gray-900">{employee.total_bookings || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total Ganho</p>
                              <p className="text-xl font-bold text-green-600">€{(employee.total_earnings || 0).toFixed(2)}</p>
                            </div>
                          </div>

                          {employee.specialties && employee.specialties.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Especialidades:</p>
                              <div className="flex flex-wrap gap-2">
                                {employee.specialties.map((spec, idx) => (
                                  <Badge key={idx} variant="outline">{spec}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => {
                            setEditingEmployee(employee);
                            setShowEmployeeForm(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteEmployeeMutation.mutate(employee.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Análises de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-4">Performance dos Anúncios</h3>
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900">{announcement.title}</p>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Visualizações</p>
                            <p className="text-lg font-bold">{announcement.views_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Cliques</p>
                            <p className="text-lg font-bold">{announcement.clicks_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">CTR</p>
                            <p className="text-lg font-bold text-green-600">
                              {announcement.views_count > 0 
                                ? ((announcement.clicks_count / announcement.views_count) * 100).toFixed(1)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-4">ROI de Anúncios Pagos</h3>
                    {announcements.filter(a => a.is_featured).map(announcement => (
                      <div key={announcement.id} className="mb-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="font-semibold text-gray-900">{announcement.title}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Investimento</p>
                            <p className="text-lg font-bold text-red-600">€{announcement.featured_payment_amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Conversões</p>
                            <p className="text-lg font-bold text-green-600">{announcement.conversions_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

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
      featured_tier: "none"
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
          <h3 className="text-lg font-bold mb-4">
            {editingAnnouncement ? 'Editar Anúncio' : 'Criar Novo Anúncio'}
          </h3>
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
                <Crown className="w-5 h-5 text-yellow-600" />
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
                  <SelectItem value="none">Sem Destaque (Grátis)</SelectItem>
                  <SelectItem value="basic">Basic - €49/mês</SelectItem>
                  <SelectItem value="premium">Premium - €99/mês</SelectItem>
                  <SelectItem value="exclusive">Exclusive - €199/mês</SelectItem>
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
                  <p className="text-xs text-gray-600 mt-2">
                    ⚠️ O pagamento será processado após aprovação do anúncio
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={() => setShowAnnouncementForm(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={() => saveAnnouncementMutation.mutate(formData)} className="bg-purple-600">
              {editingAnnouncement ? 'Atualizar' : 'Criar'} Anúncio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function EmployeeForm() {
    const [formData, setFormData] = useState(editingEmployee || {
      employee_name: "",
      employee_email: "",
      employee_phone: "",
      employee_type: "walker",
      hourly_rate: 0,
      commission_split: 70,
      specialties: [],
      is_active: true,
      hire_date: new Date().toISOString().split('T')[0]
    });

    const [specialtyInput, setSpecialtyInput] = useState("");

    const addSpecialty = () => {
      if (specialtyInput && !formData.specialties.includes(specialtyInput)) {
        setFormData({
          ...formData,
          specialties: [...formData.specialties, specialtyInput]
        });
        setSpecialtyInput("");
      }
    };

    const removeSpecialty = (spec) => {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== spec)
      });
    };

    return (
      <Card className="bg-green-50 border-2 border-green-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">
            {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                placeholder="João Silva"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.employee_email}
                onChange={(e) => setFormData({...formData, employee_email: e.target.value})}
                placeholder="joao@email.com"
              />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input
                value={formData.employee_phone}
                onChange={(e) => setFormData({...formData, employee_phone: e.target.value})}
                placeholder="+351 912 345 678"
              />
            </div>
            <div>
              <Label>Tipo de Serviço *</Label>
              <Select value={formData.employee_type} onValueChange={(v) => setFormData({...formData, employee_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="walker">Passeador</SelectItem>
                  <SelectItem value="trainer">Treinador</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Taxa Horária (€) *</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Comissão do Funcionário (%) *</Label>
              <Input
                type="number"
                value={formData.commission_split}
                onChange={(e) => setFormData({...formData, commission_split: parseFloat(e.target.value)})}
                placeholder="70"
              />
              <p className="text-xs text-gray-500 mt-1">
                Empresa fica com {100 - formData.commission_split}%
              </p>
            </div>
            <div>
              <Label>Data de Contratação</Label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.is_active.toString()} onValueChange={(v) => setFormData({...formData, is_active: v === 'true'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Especialidades</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  placeholder="Ex: Cães grandes, Treino de obediência..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                />
                <Button type="button" onClick={addSpecialty}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((spec, idx) => (
                  <Badge key={idx} className="cursor-pointer" onClick={() => removeSpecialty(spec)}>
                    {spec} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => setShowEmployeeForm(false)} variant="outline">Cancelar</Button>
            <Button onClick={() => saveEmployeeMutation.mutate(formData)}>
              {editingEmployee ? 'Atualizar' : 'Adicionar'} Funcionário
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function ProductForm() {
    const [formData, setFormData] = useState(editingProduct || {
      product_name: "",
      description: "",
      category: "food",
      price_euro: 0,
      points_cost: 0,
      stock_quantity: 0,
      is_redeemable_with_points: true,
      is_available: true
    });

    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Produto *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Comida</SelectItem>
                  <SelectItem value="toys">Brinquedos</SelectItem>
                  <SelectItem value="accessories">Acessórios</SelectItem>
                  <SelectItem value="grooming">Higiene</SelectItem>
                  <SelectItem value="health">Saúde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preço (€) *</Label>
              <Input
                type="number"
                value={formData.price_euro}
                onChange={(e) => setFormData({...formData, price_euro: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Custo em Pontos *</Label>
              <Input
                type="number"
                value={formData.points_cost}
                onChange={(e) => setFormData({...formData, points_cost: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Quantidade em Stock *</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => setShowProductForm(false)} variant="outline">Cancelar</Button>
            <Button onClick={() => saveProductMutation.mutate(formData)}>
              {editingProduct ? 'Atualizar' : 'Adicionar'} Produto
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
