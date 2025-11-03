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
  Users, UserPlus, Mail, Phone, Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['partnerCompany'],
    queryFn: async () => {
      const companies = await base44.entities.PartnerCompany.filter({ 
        company_email: user?.email 
      });
      return companies[0];
    },
    enabled: !!user,
  });

  const { data: products } = useQuery({
    queryKey: ['companyProducts'],
    queryFn: () => base44.entities.PartnerProduct.filter({ 
      partner_id: company?.partnership_id 
    }),
    enabled: !!company,
    initialData: [],
  });

  const { data: employees } = useQuery({
    queryKey: ['companyEmployees'],
    queryFn: () => base44.entities.CompanyEmployee.filter({ 
      company_id: company?.id 
    }),
    enabled: !!company,
    initialData: [],
  });

  const { data: announcements } = useQuery({
    queryKey: ['companyAnnouncements'],
    queryFn: () => base44.entities.CompanyAnnouncement.filter({ 
      company_id: company?.id 
    }),
    enabled: !!company,
    initialData: [],
  });

  const { data: redemptions } = useQuery({
    queryKey: ['companyRedemptions'],
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

  if (!company) {
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
    totalSales: company.total_sales || 0,
    totalRedemptions: redemptions.length,
    revenue: redemptions.reduce((sum, r) => sum + (r.euro_value || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-green-600" />
            {company.company_name} - Painel de Gestão
          </h1>
          <p className="text-gray-600 text-lg">Gira produtos, funcionários, vendas e promoções</p>
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
                  <p className="text-sm text-gray-600">Funcionários Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeEmployees}</p>
                </div>
                <Users className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resgates</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalRedemptions}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
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
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="announcements">Anúncios</TabsTrigger>
            <TabsTrigger value="redemptions">Resgates</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

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

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Promoções & Anúncios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{announcement.title}</h3>
                          <p className="text-gray-600 mt-2">{announcement.message}</p>
                          <div className="flex gap-2 mt-3">
                            <Badge>{announcement.promotion_type}</Badge>
                            {announcement.discount_percentage > 0 && (
                              <Badge className="bg-red-500 text-white">
                                {announcement.discount_percentage}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redemptions Tab */}
          <TabsContent value="redemptions">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Resgates Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {redemptions.map((redemption) => (
                    <div key={redemption.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{redemption.product_name}</p>
                        <p className="text-sm text-gray-600">{redemption.user_name}</p>
                        <p className="text-xs text-gray-500">Código: {redemption.redemption_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{redemption.points_spent} pontos</p>
                        <Badge>{redemption.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

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