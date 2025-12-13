import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, Package, Megaphone, Award, Trash2, Edit, Plus, Check, X, Building2, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";

export default function AdminShopHub() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("companies");
  
  // Companies
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({});
  
  // Products
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({});
  
  // Announcements
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({});
  
  // Badges
  const [editingBadge, setEditingBadge] = useState(null);
  const [badgeForm, setBadgeForm] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['adminCompanies'],
    queryFn: () => base44.entities.PartnerCompany.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => base44.entities.PartnerProduct.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['adminAnnouncements'],
    queryFn: () => base44.entities.CompanyAnnouncement.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['adminBadges'],
    queryFn: () => base44.entities.BadgeDefinition.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  // Company Mutations
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.PartnerCompany.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCompanies']);
      toast.success('Empresa atualizada');
      setEditingCompany(null);
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.PartnerCompany.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCompanies']);
      toast.success('Empresa eliminada');
    },
  });

  // Product Mutations
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.PartnerProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Produto atualizado');
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Produto eliminado');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.PartnerProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminProducts']);
      toast.success('Produto criado');
      setProductForm({});
    },
  });

  // Announcement Mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.CompanyAnnouncement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      toast.success('Anúncio criado');
      setAnnouncementForm({});
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.CompanyAnnouncement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      toast.success('Anúncio atualizado');
      setEditingAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.CompanyAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      toast.success('Anúncio eliminado');
    },
  });

  // Badge Mutations
  const updateBadgeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.BadgeDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBadges']);
      toast.success('Emblema atualizado');
      setEditingBadge(null);
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.BadgeDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBadges']);
      toast.success('Emblema eliminado');
    },
  });

  const createBadgeMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.BadgeDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBadges']);
      toast.success('Emblema criado');
      setBadgeForm({});
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-red-600 font-bold">Acesso negado - apenas administradores</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Admin Shop Hub</h1>
          <p className="text-gray-600">Controlo total da loja, produtos, empresas e emblemas</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="companies">
              <Building2 className="w-4 h-4 mr-2" />
              Empresas ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Produtos ({products.length})
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="w-4 h-4 mr-2" />
              Anúncios ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="w-4 h-4 mr-2" />
              Emblemas ({badges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <div className="grid gap-4">
              {companies.map((company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {company.logo_url && (
                            <img src={company.logo_url} alt={company.company_name} className="w-12 h-12 object-contain rounded" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold">{company.company_name}</h3>
                            <Badge variant={company.is_active ? "success" : "secondary"}>
                              {company.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Email: {company.company_email}</p>
                            <p className="text-gray-600">Telefone: {company.phone}</p>
                            <p className="text-gray-600">Website: {company.website || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tipo: {company.company_type}</p>
                            <p className="text-gray-600">Distrito: {company.district || 'N/A'}</p>
                            <p className="text-gray-600">Verificada: {company.is_verified ? '✅' : '❌'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingCompany(company);
                              setCompanyForm(company);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Empresa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Nome</Label>
                                <Input 
                                  value={companyForm.company_name || ''} 
                                  onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input 
                                  value={companyForm.company_email || ''} 
                                  onChange={(e) => setCompanyForm({...companyForm, company_email: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Telefone</Label>
                                <Input 
                                  value={companyForm.phone || ''} 
                                  onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Website</Label>
                                <Input 
                                  value={companyForm.website || ''} 
                                  onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})}
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={companyForm.is_active || false}
                                    onChange={(e) => setCompanyForm({...companyForm, is_active: e.target.checked})}
                                  />
                                  Ativa
                                </label>
                                <label className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={companyForm.is_verified || false}
                                    onChange={(e) => setCompanyForm({...companyForm, is_verified: e.target.checked})}
                                  />
                                  Verificada
                                </label>
                              </div>
                              <Button 
                                onClick={() => updateCompanyMutation.mutate({ id: company.id, data: companyForm })}
                                className="w-full"
                              >
                                Guardar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Eliminar esta empresa? Isto não pode ser desfeito!')) {
                              deleteCompanyMutation.mutate(company.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Produto Próprio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Novo Produto da Plataforma</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input 
                        value={productForm.product_name || ''} 
                        onChange={(e) => setProductForm({...productForm, product_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea 
                        value={productForm.description || ''} 
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="toys">Toys</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="grooming">Grooming</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Preço (€)</Label>
                        <Input 
                          type="number" 
                          value={productForm.price_euro || ''} 
                          onChange={(e) => setProductForm({...productForm, price_euro: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Custo em Pontos</Label>
                        <Input 
                          type="number" 
                          value={productForm.points_cost || ''} 
                          onChange={(e) => setProductForm({...productForm, points_cost: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input 
                        type="number" 
                        value={productForm.stock_quantity || 0} 
                        onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>URL da Imagem</Label>
                      <Input 
                        value={productForm.image_url || ''} 
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={productForm.is_available || false}
                          onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                        />
                        Disponível
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={productForm.is_redeemable_with_points !== false}
                          onChange={(e) => setProductForm({...productForm, is_redeemable_with_points: e.target.checked})}
                        />
                        Resgatável com Pontos
                      </label>
                    </div>
                    <Button 
                      onClick={() => createProductMutation.mutate({
                        ...productForm,
                        partner_id: 'platform',
                        partner_name: 'PawCão',
                        partner_company_email: 'admin@pawcao.net',
                        moderation_status: 'approved'
                      })}
                      className="w-full"
                    >
                      Criar Produto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{product.product_name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{product.partner_name}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge variant={product.is_available ? "success" : "secondary"}>
                            {product.is_available ? 'Disponível' : 'Indisponível'}
                          </Badge>
                          <Badge variant={product.moderation_status === 'approved' ? "success" : "secondary"}>
                            {product.moderation_status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-green-600">€{product.price_euro}</p>
                            {product.points_cost && <p className="text-xs text-gray-600">{product.points_cost} pts</p>}
                            <p className="text-xs text-gray-600">Stock: {product.stock_quantity || 0}</p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setEditingProduct(product);
                                  setProductForm(product);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Editar Produto</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Nome</Label>
                                    <Input 
                                      value={productForm.product_name || ''} 
                                      onChange={(e) => setProductForm({...productForm, product_name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Descrição</Label>
                                    <Textarea 
                                      value={productForm.description || ''} 
                                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Preço (€)</Label>
                                      <Input 
                                        type="number" 
                                        value={productForm.price_euro || ''} 
                                        onChange={(e) => setProductForm({...productForm, price_euro: parseFloat(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label>Stock</Label>
                                      <Input 
                                        type="number" 
                                        value={productForm.stock_quantity || 0} 
                                        onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value)})}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Status de Moderação</Label>
                                    <Select value={productForm.moderation_status} onValueChange={(val) => setProductForm({...productForm, moderation_status: val})}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="approved">Aprovado</SelectItem>
                                        <SelectItem value="rejected">Rejeitado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <label className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      checked={productForm.is_available || false}
                                      onChange={(e) => setProductForm({...productForm, is_available: e.target.checked})}
                                    />
                                    Disponível
                                  </label>
                                  <Button 
                                    onClick={() => updateProductMutation.mutate({ id: product.id, data: productForm })}
                                    className="w-full"
                                  >
                                    Guardar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Eliminar este produto?')) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Anúncio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Novo Anúncio da Plataforma</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Título</Label>
                      <Input 
                        value={announcementForm.title || ''} 
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Mensagem</Label>
                      <Textarea 
                        value={announcementForm.message || ''} 
                        onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>URL da Imagem</Label>
                      <Input 
                        value={announcementForm.image_url || ''} 
                        onChange={(e) => setAnnouncementForm({...announcementForm, image_url: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Tipo de Promoção</Label>
                      <Select value={announcementForm.promotion_type} onValueChange={(val) => setAnnouncementForm({...announcementForm, promotion_type: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flash_sale">Flash Sale</SelectItem>
                          <SelectItem value="new_product">New Product</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="points_bonus">Points Bonus</SelectItem>
                          <SelectItem value="free_gift">Free Gift</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Desconto (%)</Label>
                        <Input 
                          type="number" 
                          value={announcementForm.discount_percentage || ''} 
                          onChange={(e) => setAnnouncementForm({...announcementForm, discount_percentage: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Tier de Destaque</Label>
                        <Select value={announcementForm.featured_tier} onValueChange={(val) => setAnnouncementForm({...announcementForm, featured_tier: val})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data Início</Label>
                        <Input 
                          type="date" 
                          value={announcementForm.start_date || ''} 
                          onChange={(e) => setAnnouncementForm({...announcementForm, start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Data Fim</Label>
                        <Input 
                          type="date" 
                          value={announcementForm.end_date || ''} 
                          onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={announcementForm.is_active !== false}
                          onChange={(e) => setAnnouncementForm({...announcementForm, is_active: e.target.checked})}
                        />
                        Ativo
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={announcementForm.is_featured || false}
                          onChange={(e) => setAnnouncementForm({...announcementForm, is_featured: e.target.checked})}
                        />
                        Featured
                      </label>
                    </div>
                    <Button 
                      onClick={() => createAnnouncementMutation.mutate({
                        ...announcementForm,
                        company_id: 'platform',
                        company_name: 'PawCão',
                        company_email: 'admin@pawcao.net',
                        moderation_status: 'approved'
                      })}
                      className="w-full"
                    >
                      Criar Anúncio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
                        <p className="text-gray-600 mb-3">{announcement.message}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={announcement.is_active ? "success" : "secondary"}>
                            {announcement.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant={announcement.moderation_status === 'approved' ? "success" : "secondary"}>
                            {announcement.moderation_status}
                          </Badge>
                          {announcement.is_featured && <Badge className="bg-yellow-500">⭐ Featured</Badge>}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Empresa: {announcement.company_name}</p>
                          <p>Desconto: {announcement.discount_percentage || 0}%</p>
                          {announcement.start_date && <p>Início: {new Date(announcement.start_date).toLocaleDateString()}</p>}
                          {announcement.end_date && <p>Fim: {new Date(announcement.end_date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingAnnouncement(announcement);
                              setAnnouncementForm(announcement);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Anúncio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Título</Label>
                                <Input 
                                  value={announcementForm.title || ''} 
                                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Mensagem</Label>
                                <Textarea 
                                  value={announcementForm.message || ''} 
                                  onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Desconto (%)</Label>
                                <Input 
                                  type="number" 
                                  value={announcementForm.discount_percentage || ''} 
                                  onChange={(e) => setAnnouncementForm({...announcementForm, discount_percentage: parseInt(e.target.value)})}
                                />
                              </div>
                              <div>
                                <Label>Status de Moderação</Label>
                                <Select value={announcementForm.moderation_status} onValueChange={(val) => setAnnouncementForm({...announcementForm, moderation_status: val})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="approved">Aprovado</SelectItem>
                                    <SelectItem value="rejected">Rejeitado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={announcementForm.is_active || false}
                                    onChange={(e) => setAnnouncementForm({...announcementForm, is_active: e.target.checked})}
                                  />
                                  Ativo
                                </label>
                                <label className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={announcementForm.is_featured || false}
                                    onChange={(e) => setAnnouncementForm({...announcementForm, is_featured: e.target.checked})}
                                  />
                                  Featured
                                </label>
                              </div>
                              <Button 
                                onClick={() => updateAnnouncementMutation.mutate({ id: announcement.id, data: announcementForm })}
                                className="w-full"
                              >
                                Guardar
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Eliminar este anúncio?')) {
                              deleteAnnouncementMutation.mutate(announcement.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <div className="mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Emblema
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Emblema</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input 
                        value={badgeForm.name || ''} 
                        onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea 
                        value={badgeForm.description || ''} 
                        onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Ícone (emoji ou URL)</Label>
                      <Input 
                        value={badgeForm.icon || ''} 
                        onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={badgeForm.category} onValueChange={(val) => setBadgeForm({...badgeForm, category: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="behavior">Behavior</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Raridade</Label>
                      <Select value={badgeForm.rarity} onValueChange={(val) => setBadgeForm({...badgeForm, rarity: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => createBadgeMutation.mutate(badgeForm)}
                      className="w-full"
                    >
                      Criar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold">{badge.name}</h3>
                        <Badge variant="outline" className="text-xs">{badge.rarity}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingBadge(badge);
                            setBadgeForm(badge);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Emblema</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Nome</Label>
                              <Input 
                                value={badgeForm.name || ''} 
                                onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Descrição</Label>
                              <Textarea 
                                value={badgeForm.description || ''} 
                                onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Ícone</Label>
                              <Input 
                                value={badgeForm.icon || ''} 
                                onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})}
                              />
                            </div>
                            <Button 
                              onClick={() => updateBadgeMutation.mutate({ id: badge.id, data: badgeForm })}
                              className="w-full"
                            >
                              Guardar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Eliminar este emblema?')) {
                            deleteBadgeMutation.mutate(badge.id);
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}