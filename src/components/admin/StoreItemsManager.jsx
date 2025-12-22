import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, Pencil, Trash2, ShoppingCart, Calendar, Megaphone, 
  RefreshCw, Image as ImageIcon, Loader2, Upload, X
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORIES = [
  'Alimentação', 'Acessórios', 'Brinquedos', 'Higiene', 
  'Veterinária', 'Estética', 'Treino', 'Seguro', 'Outro'
];

const ITEM_TYPES = [
  { value: 'product', label: 'Produto', icon: ShoppingCart, color: 'bg-blue-500' },
  { value: 'service', label: 'Serviço', icon: Calendar, color: 'bg-green-500' },
  { value: 'ad_slot', label: 'Anúncio', icon: Megaphone, color: 'bg-purple-500' },
];

const emptyItem = {
  type: 'product',
  category: 'Outro',
  title: '',
  description: '',
  brand: '',
  provider: '',
  price: 0,
  price_text: '',
  original_price: null,
  image_url: '',
  badge: '',
  rating: 0,
  reviews_count: 0,
  duration: '',
  availability: '',
  cta_text: '',
  cta_url: '',
  is_active: true,
  is_featured: false,
  stock: 0,
  order: 0
};

export default function StoreItemsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyItem);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminStoreItems'],
    queryFn: () => base44.entities.StoreItem.list('-created_date', 100),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StoreItem.create(data),
    onSuccess: () => {
      toast.success('Item criado com sucesso!');
      queryClient.invalidateQueries(['adminStoreItems', 'storeItems']);
      handleCloseDialog();
    },
    onError: () => toast.error('Erro ao criar item.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StoreItem.update(id, data),
    onSuccess: () => {
      toast.success('Item atualizado!');
      queryClient.invalidateQueries(['adminStoreItems', 'storeItems']);
      handleCloseDialog();
    },
    onError: () => toast.error('Erro ao atualizar item.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StoreItem.delete(id),
    onSuccess: () => {
      toast.success('Item eliminado!');
      queryClient.invalidateQueries(['adminStoreItems', 'storeItems']);
    },
    onError: () => toast.error('Erro ao eliminar item.')
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries(['adminStoreItems', 'storeItems']);
    setIsRefreshing(false);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(emptyItem);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...emptyItem, ...item });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData(emptyItem);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('O título é obrigatório.');
      return;
    }

    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      rating: parseFloat(formData.rating) || 0,
      reviews_count: parseInt(formData.reviews_count) || 0,
      stock: parseInt(formData.stock) || 0,
      order: parseInt(formData.order) || 0,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleDelete = (item) => {
    if (confirm(`Tem certeza que deseja eliminar "${item.title}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleToggleActive = (item) => {
    updateMutation.mutate({ 
      id: item.id, 
      data: { is_active: !item.is_active } 
    });
  };

  const getTypeInfo = (type) => ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[0];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          PawStore - Gestão de Itens
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nenhum item na loja ainda.</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Item
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const typeInfo = getTypeInfo(item.type);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.brand || item.provider || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeInfo.color} text-white`}>
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>
                        {item.price_text || (item.price ? `€${item.price.toFixed(2)}` : '-')}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={item.is_active} 
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg p-0 max-h-[85vh] flex flex-col">
            <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 px-4">
              <div className="grid gap-3 py-3">
              {/* Type & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({...formData, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Ração Premium 15kg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição detalhada..."
                  rows={3}
                />
              </div>

              {/* Brand / Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.type === 'product' && (
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input 
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="Ex: Royal Canin"
                    />
                  </div>
                )}
                {formData.type === 'service' && (
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Input 
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      placeholder="Ex: PetShop Bonfim"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Badge Promocional</Label>
                  <Input 
                    value={formData.badge}
                    onChange={(e) => setFormData({...formData, badge: e.target.value})}
                    placeholder="Ex: -20%, Envio Grátis"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Preço (€)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Original (€)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.original_price || ''}
                    onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                    placeholder="Para mostrar desconto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto de Preço</Label>
                  <Input 
                    value={formData.price_text}
                    onChange={(e) => setFormData({...formData, price_text: e.target.value})}
                    placeholder="Ex: A partir de 25€"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagem</Label>
                <div className="flex flex-col gap-2">
                  {formData.image_url ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 w-7 h-7"
                        onClick={() => setFormData({...formData, image_url: ''})}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Carregar imagem</span>
                        </>
                      )}
                    </label>
                  )}
                  <div className="text-center text-xs text-gray-400">ou</div>
                  <Input 
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="Cole um URL de imagem..."
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Service specific fields */}
              {formData.type === 'service' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Duração</Label>
                    <Input 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="Ex: 1h 30m"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilidade</Label>
                    <Input 
                      value={formData.availability}
                      onChange={(e) => setFormData({...formData, availability: e.target.value})}
                      placeholder="Ex: Hoje, Amanhã"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avaliação (1-5)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Ad Slot specific fields */}
              {formData.type === 'ad_slot' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input 
                      value={formData.cta_text}
                      onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                      placeholder="Ex: Anunciar Agora"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Botão</Label>
                    <Input 
                      value={formData.cta_url}
                      onChange={(e) => setFormData({...formData, cta_url: e.target.value})}
                      placeholder="/RegisterCompany"
                    />
                  </div>
                </div>
              )}

              {/* Active & Featured */}
              <div className="flex items-center gap-6 pt-2 pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                  />
                  <span className="text-sm">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch 
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({...formData, is_featured: v})}
                  />
                  <span className="text-sm">Destaque</span>
                </label>
              </div>
            </div>
            </ScrollArea>

            <DialogFooter className="p-4 pt-2 border-t flex-shrink-0 gap-2">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="flex-1 sm:flex-none"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingItem ? 'Guardar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}