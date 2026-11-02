import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Edit, Trash2, CheckCircle, X, AlertTriangle, Package, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import Pagination from "@/components/ui/Pagination";

export default function ProductManagement({ products, isLoading }) {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeMode, setRemoveMode] = useState('deactivate');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm || 
        p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.partner_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || p.moderation_status === statusFilter;
      
      const price = p.price_euro || 0;
      const matchesPriceMin = !priceMin || price >= parseFloat(priceMin);
      const matchesPriceMax = !priceMax || price <= parseFloat(priceMax);
      
      const stock = p.stock_quantity || 0;
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'low' && stock < 10) ||
        (stockFilter === 'out' && stock === 0);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriceMin && matchesPriceMax && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, statusFilter, priceMin, priceMax, stockFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, page, perPage]);

  const lowStockCount = products.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0).length;

  // Mutations
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PartnerProduct.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerProducts'] });
      setShowEditModal(false);
      setEditingProduct(null);
      toast.success('Produto atualizado!');
    },
  });

  const deleteProductsMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.PartnerProduct.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerProducts'] });
      setSelectedProducts([]);
      toast.success('Produtos eliminados!');
    },
  });

  const removeFromStoreMutation = useMutation({
    mutationFn: async ({ product, mode }) => {
      if (mode === 'delete') {
        await base44.entities.PartnerProduct.delete(product.id);
      } else {
        await base44.entities.PartnerProduct.update(product.id, { is_available: false });
      }
      if (product.partner_company_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: product.partner_company_email,
            subject: mode === 'delete' ? 'Produto removido da loja PawCão' : 'Produto desativado na loja PawCão',
            body: `Olá,\n\nO produto "${product.product_name}" foi ${mode === 'delete' ? 'removido definitivamente' : 'desativado'} da loja por administração da PawCão.${mode === 'deactivate' ? ' Pode reativá-lo a qualquer momento nos seus produtos.' : ''}\n\nCumprimentos,\nEquipa PawCão`,
          });
        } catch (e) {
          console.warn('Notify partner email failed:', e?.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartnerProducts'] });
      setRemoveTarget(null);
      toast.success('Produto removido da loja!');
    },
  });

  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(pid => pid !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Eliminar ${selectedProducts.length} produtos selecionados?`)) {
      deleteProductsMutation.mutate(selectedProducts);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingProduct.product_name || !editingProduct.price_euro) {
      toast.error('Preencha nome e preço!');
      return;
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        product_name: editingProduct.product_name,
        description: editingProduct.description,
        category: editingProduct.category,
        price_euro: parseFloat(editingProduct.price_euro),
        points_cost: parseInt(editingProduct.points_cost) || 0,
        stock_quantity: parseInt(editingProduct.stock_quantity) || 0,
        discount_percentage: parseInt(editingProduct.discount_percentage) || 0,
        image_url: editingProduct.image_url,
        moderation_status: editingProduct.moderation_status,
        is_available: editingProduct.is_available
      }
    });
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {lowStockCount > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">
                ⚠️ {lowStockCount} produto{lowStockCount !== 1 ? 's' : ''} com stock baixo
              </p>
              <p className="text-sm text-orange-700">Produtos com menos de 10 unidades em stock</p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setStockFilter('low')}
              className="ml-auto"
            >
              Ver Produtos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtros Avançados */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1">Buscar</Label>
              <Input
                placeholder="Nome ou parceiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs mb-1">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
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
              <Label className="text-xs mb-1">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">🕐 Pendente</SelectItem>
                  <SelectItem value="approved">✅ Aprovado</SelectItem>
                  <SelectItem value="rejected">❌ Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1">Stock</Label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">⚠️ Baixo (&lt;10)</SelectItem>
                  <SelectItem value="out">🔴 Esgotado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1">Preço Mín (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs mb-1">Preço Máx (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="999"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex items-end col-span-full md:col-span-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setPriceMin('');
                  setPriceMax('');
                  setStockFilter('all');
                }}
                className="h-9"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-purple-600">
                  {selectedProducts.length} selecionado{selectedProducts.length !== 1 ? 's' : ''}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={deleteProductsMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Selecionados
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-sm font-medium">Selecionar Todos (nesta página)</span>
          </div>

          <div className="space-y-3">
            {paginatedProducts.map((product) => {
              const isPending = product.moderation_status === 'pending';
              const isApproved = product.moderation_status === 'approved';
              const isLowStock = (product.stock_quantity || 0) < 10 && (product.stock_quantity || 0) > 0;
              const isOutOfStock = (product.stock_quantity || 0) === 0;
              const isSelected = selectedProducts.includes(product.id);

              return (
                <Card 
                  key={product.id} 
                  className={`border-2 transition-all ${
                    isSelected ? 'border-purple-400 bg-purple-50' :
                    isPending ? 'border-orange-200 bg-orange-50' :
                    isApproved ? 'border-green-200 bg-green-50' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectProduct(product.id)}
                        className="mt-1 w-5 h-5 accent-purple-600 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Imagem */}
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0" 
                          alt={product.product_name}
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate">{product.product_name}</h3>
                        <p className="text-sm text-gray-600 truncate">{product.partner_name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{product.description}</p>
                        
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={
                            isPending ? 'bg-orange-500' :
                            isApproved ? 'bg-green-600' :
                            'bg-red-600'
                          }>
                            {isPending ? '⏳' : isApproved ? '✅' : '❌'} {product.moderation_status}
                          </Badge>
                          
                          <Badge variant="outline" className="font-bold">{formatMoney(product.price_euro, product.price_currency)}</Badge>
                          
                          {product.points_cost > 0 && (
                            <Badge className="bg-purple-500">{product.points_cost} pts</Badge>
                          )}
                          
                          <Badge variant="outline" className="capitalize">{product.category}</Badge>
                          
                          {isOutOfStock ? (
                            <Badge className="bg-red-600">🔴 Esgotado</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-orange-500">⚠️ Stock: {product.stock_quantity}</Badge>
                          ) : (
                            <Badge variant="outline">Stock: {product.stock_quantity || 0}</Badge>
                          )}
                          
                          {product.is_available ? (
                            <Badge className="bg-blue-600">🟢 Visível</Badge>
                          ) : (
                            <Badge variant="outline">🔴 Oculto</Badge>
                          )}

                          {product.discount_percentage > 0 && (
                            <Badge className="bg-pink-500">-{product.discount_percentage}%</Badge>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {isPending && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateProductMutation.mutate({
                                id: product.id,
                                data: { moderation_status: 'approved', is_available: true }
                              })}
                              className="bg-green-600 h-8 px-3"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Motivo:');
                                if (reason) {
                                  updateProductMutation.mutate({
                                    id: product.id,
                                    data: { moderation_status: 'rejected', rejection_reason: reason }
                                  });
                                }
                              }}
                              className="text-red-600 h-8 px-3"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                          className="h-8"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setRemoveTarget(product); setRemoveMode('deactivate'); }}
                          className="h-8 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          Tirar da Loja
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {filteredProducts.length > perPage && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(filteredProducts.length / perPage)}
              onPageChange={setPage}
              itemsPerPage={perPage}
              totalItems={filteredProducts.length}
              onItemsPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              {editingProduct.image_url && (
                <img 
                  src={editingProduct.image_url} 
                  className="w-full max-w-sm h-48 object-cover rounded-lg mx-auto" 
                  alt="Product" 
                />
              )}

              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={editingProduct.product_name || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={editingProduct.category} 
                    onValueChange={(v) => setEditingProduct({ ...editingProduct, category: v })}
                  >
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
                  <Label>Status de Moderação</Label>
                  <Select 
                    value={editingProduct.moderation_status} 
                    onValueChange={(v) => setEditingProduct({ ...editingProduct, moderation_status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Em Análise</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.price_euro || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price_euro: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Custo em Pontos</Label>
                  <Input
                    type="number"
                    value={editingProduct.points_cost || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, points_cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={editingProduct.stock_quantity || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProduct.discount_percentage || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discount_percentage: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingProduct.is_available || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <Label>Produto Visível na Loja</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateProductMutation.isPending}
              className="bg-blue-600"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Tirar da Loja */}
      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tirar produto da loja</DialogTitle>
          </DialogHeader>
          {removeTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-700">Escolha como remover <strong>{removeTarget.product_name}</strong>:</p>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${removeMode === 'deactivate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="radio" checked={removeMode === 'deactivate'} onChange={() => setRemoveMode('deactivate')} className="mt-1" />
                  <div>
                    <p className="font-semibold text-sm">Desativar (manter registo)</p>
                    <p className="text-xs text-gray-500">O produto deixa de aparecer na loja mas fica guardado. O parceiro pode reativá-lo.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${removeMode === 'delete' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                  <input type="radio" checked={removeMode === 'delete'} onChange={() => setRemoveMode('delete')} className="mt-1" />
                  <div>
                    <p className="font-semibold text-sm text-red-600">Apagar definitivo</p>
                    <p className="text-xs text-gray-500">Remove permanentemente o produto. Não pode ser desfeito.</p>
                  </div>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancelar</Button>
            <Button
              variant={removeMode === 'delete' ? 'destructive' : 'default'}
              onClick={() => removeFromStoreMutation.mutate({ product: removeTarget, mode: removeMode })}
              disabled={removeFromStoreMutation.isPending}
            >
              {removeMode === 'delete' ? 'Apagar Definitivamente' : 'Desativar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}