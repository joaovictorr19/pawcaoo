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
    <Card className="overflow-hidden border-0 shadow-sm bg-white h-full rounded-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        
        {item.badge && (
          <span className={`absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded ${
            item.badge.includes('%') || item.badge.includes('-')
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            {item.badge}
          </span>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center"
        >
          <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      <CardContent className="p-2">
        {item.brand && (
          <p className="text-[9px] text-gray-500 uppercase truncate">{item.brand}</p>
        )}
        
        <h3 className="font-medium text-gray-900 text-[11px] leading-tight mb-1 line-clamp-2">
          {item.title}
        </h3>

        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-sm font-bold text-gray-900">
            €{(item.price || 0).toFixed(2)}
          </span>
          {item.original_price && (
            <span className="text-[10px] text-gray-400 line-through">
              €{item.original_price.toFixed(2)}
            </span>
          )}
        </div>

        <button className="w-full bg-blue-600 text-white text-[10px] py-1.5 rounded font-medium flex items-center justify-center gap-1">
          <ShoppingCart className="w-3 h-3" />
          Adicionar
        </button>
      </CardContent>
    </Card>
  );
}

// Service Card
function ServiceCard({ item }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white h-full rounded-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400'} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        
        {item.availability && (
          <span className="absolute top-1 left-1 bg-green-500 text-white text-[9px] px-1 py-0.5 rounded">
            {item.availability}
          </span>
        )}

        {item.duration && (
          <span className="absolute top-1 right-1 bg-white/80 text-gray-700 text-[9px] px-1 py-0.5 rounded">
            {item.duration}
          </span>
        )}
      </div>

      <CardContent className="p-2">
        <p className="text-[9px] text-green-600 font-medium truncate mb-0.5">{item.provider || 'Parceiro'}</p>
        
        <h3 className="font-medium text-gray-900 text-[11px] leading-tight mb-1 line-clamp-2">
          {item.title}
        </h3>

        {item.rating > 0 && (
          <div className="flex items-center gap-0.5 mb-1">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-gray-900">{item.rating}</span>
          </div>
        )}

        <div className="mb-1.5">
          <span className="text-sm font-bold text-gray-900">
            {item.price_text || (item.price ? `€${item.price.toFixed(2)}` : 'Consultar')}
          </span>
        </div>

        <button className="w-full bg-green-600 text-white text-[10px] py-1.5 rounded font-medium flex items-center justify-center gap-1">
          <Calendar className="w-3 h-3" />
          Agendar
        </button>
      </CardContent>
    </Card>
  );
}

// Ad Slot Card
function AdSlotCard({ item }) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden border border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 h-full rounded-lg">
      <CardContent className="p-2 text-center flex flex-col items-center justify-center h-full min-h-[180px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
          <Megaphone className="w-4 h-4 text-white" />
        </div>

        <h3 className="text-[11px] font-bold text-gray-900 mb-1 line-clamp-1">
          {item.title}
        </h3>

        <p className="text-[9px] text-gray-600 mb-2 line-clamp-2">
          {item.description || 'Alcance donos de pets.'}
        </p>

        <button 
          onClick={() => navigate(item.cta_url || createPageUrl('RegisterCompany'))}
          className="bg-purple-600 text-white text-[10px] py-1.5 px-3 rounded font-medium"
        >
          Anunciar
        </button>
      </CardContent>
    </Card>
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
    <div className="space-y-3 px-1 overflow-x-hidden">
      {/* Header */}
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">PawStore</h2>
        <p className="text-[11px] text-gray-600">Produtos e serviços para o seu pet</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs rounded-lg border-gray-200 shadow-sm bg-white text-gray-900 w-full"
        />
      </div>

      {/* Categories - horizontal scroll */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all flex-shrink-0 ${
              selectedCategory === cat.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat.label}
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
      <div className="p-3 border border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-xs">Tem um PetShop?</h4>
            <p className="text-[10px] text-gray-600">Venda na PawStore</p>
          </div>
          <button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 text-white text-[10px] py-1.5 px-3 rounded font-medium flex-shrink-0"
          >
            Vender
          </button>
        </div>
      </div>
    </div>
  );
}