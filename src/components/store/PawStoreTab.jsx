import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, Calendar, Star, Clock, Megaphone, 
  Search, Heart, Store, Sparkles, Truck, Shield,
  Scissors, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'Alimentação', label: 'Alimentação' },
  { id: 'Acessórios', label: 'Acessórios' },
  { id: 'Brinquedos', label: 'Brinquedos' },
  { id: 'Higiene', label: 'Higiene' },
  { id: 'Veterinária', label: 'Veterinária' },
  { id: 'Estética', label: 'Estética' },
  { id: 'Treino', label: 'Treino' },
  { id: 'Seguro', label: 'Seguro' },
];

// Product Card
function ProductCard({ item }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {item.badge && (
            <Badge className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 ${
              item.badge.includes('%') || item.badge.includes('-')
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            } shadow-sm`}>
              {item.badge.toLowerCase().includes('envio') && <Truck className="w-2.5 h-2.5 mr-0.5" />}
              {item.badge}
            </Badge>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <CardContent className="p-3">
          {item.brand && (
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{item.brand}</p>
          )}
          
          <h3 className="font-medium text-gray-900 text-sm mb-1.5 line-clamp-2 min-h-[2.25rem]">
            {item.title}
          </h3>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-lg font-bold text-gray-900">
              €{(item.price || 0).toFixed(2)}
            </span>
            {item.original_price && (
              <span className="text-xs text-gray-400 line-through">
                €{item.original_price.toFixed(2)}
              </span>
            )}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs rounded-lg font-medium shadow-sm">
            <ShoppingCart className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Service Card
function ServiceCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {item.availability && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {item.availability}
            </Badge>
          )}

          {item.duration && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] px-1.5 py-0.5 shadow-sm">
              <Clock className="w-2.5 h-2.5 mr-0.5" />
              {item.duration}
            </Badge>
          )}
        </div>

        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              {item.category === 'Estética' ? (
                <Scissors className="w-2.5 h-2.5 text-green-600" />
              ) : item.category === 'Seguro' ? (
                <Shield className="w-2.5 h-2.5 text-green-600" />
              ) : (
                <Store className="w-2.5 h-2.5 text-green-600" />
              )}
            </div>
            <p className="text-[10px] text-green-600 font-medium truncate">{item.provider || 'Parceiro'}</p>
          </div>
          
          <h3 className="font-medium text-gray-900 text-sm mb-1.5 line-clamp-2 min-h-[2.25rem]">
            {item.title}
          </h3>

          {item.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900 text-xs">{item.rating}</span>
              <span className="text-[10px] text-gray-500">({item.reviews_count || 0})</span>
            </div>
          )}

          <div className="mb-2">
            <span className="text-base font-bold text-gray-900">
              {item.price_text || (item.price ? `€${item.price.toFixed(2)}` : 'Consultar')}
            </span>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8 text-xs rounded-lg font-medium shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            Agendar
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Ad Slot Card
function AdSlotCard({ item }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="overflow-hidden border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 h-full min-h-[220px] flex flex-col justify-center">
        <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-md">
            <Megaphone className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1">
            {item.title}
          </h3>

          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {item.description || 'Alcance donos de pets.'}
          </p>

          <Button 
            onClick={() => navigate(item.cta_url || createPageUrl('RegisterCompany'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-1.5 px-4 h-8 text-xs rounded-lg font-medium shadow-sm"
          >
            <Megaphone className="w-3.5 h-3.5" />
            {item.cta_text || 'Anunciar'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Store Item Router
function StoreItemCard({ item }) {
  switch (item.type) {
    case 'product':
      return <ProductCard item={item} />;
    case 'service':
      return <ServiceCard item={item} />;
    case 'ad_slot':
      return <AdSlotCard item={item} />;
    default:
      return <ProductCard item={item} />;
  }
}

export default function PawStoreTab() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: storeItems = [], isLoading } = useQuery({
    queryKey: ['storeItems'],
    queryFn: async () => {
      const items = await base44.entities.StoreItem.filter({ is_active: true }, 'order');
      return items;
    },
    initialData: []
  });

  // Filter items
  const filteredItems = storeItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-md">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">PawStore</h2>
        <p className="text-xs md:text-sm text-gray-600">Produtos e serviços para o seu pet</p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm rounded-lg border-gray-300 shadow-sm bg-white text-gray-900"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {categories.map(cat => (
          <Button
            key={cat.id}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 h-7 text-xs font-medium transition-all flex-shrink-0 ${
              selectedCategory === cat.id 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => (
            <StoreItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-purple-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Loja em Construção</h3>
          <p className="text-xs text-gray-600 mb-4 px-4">
            Em breve teremos produtos incríveis!
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm h-8 px-4 text-xs"
          >
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Anuncie Aqui
          </Button>
        </div>
      )}

      {/* CTA for Businesses */}
      <Card className="p-4 border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mt-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-gray-900 text-sm">Tem um PetShop?</h4>
              <p className="text-xs text-gray-600">Venda na PawStore</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap rounded-lg font-medium shadow-sm h-8 px-4 text-xs w-full sm:w-auto"
          >
            Começar a Vender
          </Button>
        </div>
      </Card>
    </div>
  );
}