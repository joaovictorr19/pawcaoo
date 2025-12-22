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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all bg-white h-full rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          
          {item.badge && (
            <Badge className={`absolute top-2 left-2 ${
              item.badge.includes('%') || item.badge.includes('-')
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {item.badge}
            </Badge>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <CardContent className="p-4">
          {item.brand && (
            <p className="text-xs text-gray-500 uppercase mb-1">{item.brand}</p>
          )}
          
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900">
              €{(item.price || 0).toFixed(2)}
            </span>
            {item.original_price && (
              <span className="text-sm text-gray-400 line-through">
                €{item.original_price.toFixed(2)}
              </span>
            )}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <ShoppingCart className="w-4 h-4 mr-2" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all bg-white h-full rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          
          {item.availability && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              {item.availability}
            </Badge>
          )}

          {item.duration && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90 text-gray-700">
              <Clock className="w-3 h-3 mr-1" />
              {item.duration}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-xs text-green-600 font-medium mb-1">{item.provider || 'Parceiro PawCão'}</p>
          
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          {item.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{item.rating}</span>
              <span className="text-sm text-gray-500">({item.reviews_count || 0})</span>
            </div>
          )}

          <div className="mb-3">
            <span className="text-xl font-bold text-gray-900">
              {item.price_text || (item.price ? `€${item.price.toFixed(2)}` : 'Consultar')}
            </span>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            <Calendar className="w-4 h-4 mr-2" />
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 h-full rounded-2xl">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full min-h-[280px]">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
            <Megaphone className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {item.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {item.description || 'Alcance milhares de donos de pets.'}
          </p>

          <Button 
            onClick={() => navigate(item.cta_url || createPageUrl('RegisterCompany'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            {item.cta_text || 'Anunciar Agora'}
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">
            PawStore
          </h2>
          <p className="text-xs md:text-base text-white/90 drop-shadow-md mt-1">
            {filteredItems.length} produtos e serviços
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 text-sm rounded-xl border-gray-200 shadow-sm bg-white text-gray-900 w-full"
        />
      </div>

      {/* Categories - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all flex-shrink-0 ${
              selectedCategory === cat.id 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'bg-white/90 text-gray-700 hover:bg-white'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {filteredItems.map((item) => (
            <StoreItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
            <Store className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            Loja em Construção
          </h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">
            Em breve teremos produtos incríveis!
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Anuncie Aqui
          </Button>
        </Card>
      )}

      {/* CTA for Businesses */}
      <Card className="mt-8 p-4 md:p-6 border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base md:text-lg">Tem um PetShop?</h4>
              <p className="text-sm text-gray-600">Venda na PawStore</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto"
          >
            Começar a Vender
          </Button>
        </div>
      </Card>
    </div>
  );
}