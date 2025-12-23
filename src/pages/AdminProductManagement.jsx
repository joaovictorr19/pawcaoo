import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Pencil, Trash2, Star, Ticket } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminProductManagement() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [productDialog, setProductDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.PartnerProduct.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.ProductReview.list(),
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['allCoupons'],
    queryFn: () => base44.entities.Coupon.list(),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allProducts']);
      toast.success(language === 'pt' ? 'Produto eliminado' : 'Product deleted');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductReview.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allReviews']);
      toast.success(language === 'pt' ? 'Review eliminada' : 'Review deleted');
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCoupons']);
      setCouponDialog(false);
      setEditingCoupon(null);
      toast.success(language === 'pt' ? 'Cupom criado' : 'Coupon created');
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allCoupons']);
      setCouponDialog(false);
      setEditingCoupon(null);
      toast.success(language === 'pt' ? 'Cupom atualizado' : 'Coupon updated');
    },
  });

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      code: formData.get('code'),
      discount_type: formData.get('discount_type'),
      discount_value: parseFloat(formData.get('discount_value')),
      min_purchase: parseFloat(formData.get('min_purchase')) || 0,
      max_uses: parseInt(formData.get('max_uses')) || null,
      valid_from: formData.get('valid_from'),
      valid_until: formData.get('valid_until'),
      is_active: formData.get('is_active') === 'true',
    };

    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createCouponMutation.mutate(data);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="glass-panel">
          <CardContent className="p-12 text-center">
            <p className="text-xl text-red-600">
              {language === 'pt' ? 'Acesso negado' : 'Access denied'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {language === 'pt' ? 'Gestão de Loja' : 'Shop Management'}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Produtos' : 'Products'}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-2" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Ticket className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Cupons' : 'Coupons'}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="space-y-4">
            {products.map(product => (
              <Card key={product.id} className="glass-panel">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {product.image_url && (
                      <img src={product.image_url} className="w-20 h-20 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">€{product.price}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm(language === 'pt' ? 'Eliminar produto?' : 'Delete product?')) {
                          deleteProductMutation.mutate(product.id);
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

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <div className="space-y-4">
            {reviews.map(review => (
              <Card key={review.id} className="glass-panel">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{review.reviewer_name}</p>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{review.title}</p>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{review.product_name}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm(language === 'pt' ? 'Eliminar review?' : 'Delete review?')) {
                          deleteReviewMutation.mutate(review.id);
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

        {/* Coupons Tab */}
        <TabsContent value="coupons">
          <Button onClick={() => setCouponDialog(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'pt' ? 'Criar Cupom' : 'Create Coupon'}
          </Button>

          <div className="space-y-4">
            {coupons.map(coupon => (
              <Card key={coupon.id} className="glass-panel">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-xl">{coupon.code}</h3>
                        <Badge variant={coupon.is_active ? "default" : "secondary"}>
                          {coupon.is_active ? (language === 'pt' ? 'Ativo' : 'Active') : (language === 'pt' ? 'Inativo' : 'Inactive')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `€${coupon.discount_value}`} {language === 'pt' ? 'de desconto' : 'off'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'pt' ? 'Utilizado' : 'Used'}: {coupon.times_used || 0}
                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setCouponDialog(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? (language === 'pt' ? 'Editar Cupom' : 'Edit Coupon') : (language === 'pt' ? 'Criar Cupom' : 'Create Coupon')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCouponSubmit} className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input name="code" defaultValue={editingCoupon?.code} required />
            </div>
            <div>
              <Label>{language === 'pt' ? 'Tipo de Desconto' : 'Discount Type'}</Label>
              <Select name="discount_type" defaultValue={editingCoupon?.discount_type || 'percentage'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentagem</SelectItem>
                  <SelectItem value="fixed">Fixo (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'pt' ? 'Valor' : 'Value'}</Label>
              <Input name="discount_value" type="number" step="0.01" defaultValue={editingCoupon?.discount_value} required />
            </div>
            <div>
              <Label>{language === 'pt' ? 'Compra Mínima' : 'Min Purchase'}</Label>
              <Input name="min_purchase" type="number" step="0.01" defaultValue={editingCoupon?.min_purchase || 0} />
            </div>
            <div>
              <Label>{language === 'pt' ? 'Máx. Utilizações' : 'Max Uses'}</Label>
              <Input name="max_uses" type="number" defaultValue={editingCoupon?.max_uses} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'pt' ? 'Válido de' : 'Valid from'}</Label>
                <Input name="valid_from" type="date" defaultValue={editingCoupon?.valid_from} />
              </div>
              <div>
                <Label>{language === 'pt' ? 'Válido até' : 'Valid until'}</Label>
                <Input name="valid_until" type="date" defaultValue={editingCoupon?.valid_until} />
              </div>
            </div>
            <div>
              <Label>{language === 'pt' ? 'Estado' : 'Status'}</Label>
              <Select name="is_active" defaultValue={String(editingCoupon?.is_active ?? true)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{language === 'pt' ? 'Ativo' : 'Active'}</SelectItem>
                  <SelectItem value="false">{language === 'pt' ? 'Inativo' : 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              {editingCoupon ? (language === 'pt' ? 'Atualizar' : 'Update') : (language === 'pt' ? 'Criar' : 'Create')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}