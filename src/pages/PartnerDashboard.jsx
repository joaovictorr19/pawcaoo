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
  Edit, Trash2, Megaphone, BarChart3, ShoppingBag 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PartnerDashboard() {
  const queryClient = useQueryClient();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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
      toast.success(editingProduct ? "Product updated!" : "Product added!");
      setShowProductForm(false);
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProducts'] });
      toast.success("Product deleted!");
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Access</h2>
            <p className="text-gray-600 mb-4">
              You don't have partner company access. Contact PawCão admin to set up your company account.
            </p>
            <Button onClick={() => window.location.href = 'mailto:partners@pawcao.com'}>
              Contact Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_available).length,
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
            {company.company_name} Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Manage your products, sales, and promotions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
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
                  <p className="text-sm text-gray-600">Active Products</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeProducts}</p>
                </div>
                <ShoppingBag className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Redemptions</p>
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
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-3xl font-bold text-orange-600">€{stats.revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white shadow-lg">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Products</CardTitle>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Promotions & Announcements</CardTitle>
                <Button onClick={() => setShowAnnouncementForm(true)}>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
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
                <CardTitle>Recent Redemptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {redemptions.map((redemption) => (
                    <div key={redemption.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{redemption.product_name}</p>
                        <p className="text-sm text-gray-600">{redemption.user_name}</p>
                        <p className="text-xs text-gray-500">Code: {redemption.redemption_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{redemption.points_spent} points</p>
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
              <Label>Product Name *</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="toys">Toys</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (€) *</Label>
              <Input
                type="number"
                value={formData.price_euro}
                onChange={(e) => setFormData({...formData, price_euro: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Points Cost *</Label>
              <Input
                type="number"
                value={formData.points_cost}
                onChange={(e) => setFormData({...formData, points_cost: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Stock Quantity *</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => setShowProductForm(false)} variant="outline">Cancel</Button>
            <Button onClick={() => saveProductMutation.mutate(formData)}>
              {editingProduct ? 'Update' : 'Add'} Product
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}