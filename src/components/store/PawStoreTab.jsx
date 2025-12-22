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
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white h-full">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {item.badge && (
            <Badge className={`absolute top-3 left-3 ${
              item.badge.includes('%') || item.badge.includes('-')
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            } shadow-lg`}>
              {item.badge.toLowerCase().includes('envio') && <Truck className="w-3 h-3 mr-1" />}
              {item.badge}
            </Badge>
          )}

          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <CardContent className="p-4">
          {item.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.brand}</p>
          )}
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              €{(item.price || 0).toFixed(2)}
            </span>
            {item.original_price && (
              <span className="text-sm text-gray-400 line-through">
                €{item.original_price.toFixed(2)}
              </span>
            )}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 rounded-lg font-semibold shadow-md">
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao Carrinho
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
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white h-full">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400'} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {item.availability && (
            <Badge className="absolute top-3 left-3 bg-green-500 text-white shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Disponível {item.availability}
            </Badge>
          )}

          {item.duration && (
            <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 shadow-md">
              <Clock className="w-3 h-3 mr-1" />
              {item.duration}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              {item.category === 'Estética' ? (
                <Scissors className="w-3 h-3 text-green-600" />
              ) : item.category === 'Seguro' ? (
                <Shield className="w-3 h-3 text-green-600" />
              ) : (
                <Store className="w-3 h-3 text-green-600" />
              )}
            </div>
            <p className="text-xs text-green-600 font-medium">{item.provider || 'Parceiro PawCão'}</p>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          {item.rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{item.rating}</span>
              <span className="text-sm text-gray-500">({item.reviews_count || 0} avaliações)</span>
            </div>
          )}

          <div className="mb-4">
            <span className="text-lg font-bold text-gray-900">
              {item.price_text || (item.price ? `€${item.price.toFixed(2)}` : 'Consultar')}
            </span>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11 rounded-lg font-semibold shadow-md">
            <Calendar className="w-4 h-4" />
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
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 h-full min-h-[380px] flex flex-col justify-center">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
            <Megaphone className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {item.title}
          </h3>

          <p className="text-gray-600 mb-6 max-w-[200px]">
            {item.description || 'Alcance milhares de donos de pets em Portugal.'}
          </p>

          <Button 
            onClick={() => navigate(item.cta_url || createPageUrl('RegisterCompany'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 px-8 h-11 rounded-lg font-semibold shadow-md"
          >
            <Megaphone className="w-5 h-5" />
            {item.cta_text || 'Anunciar Agora'}
          </Button>

          <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
            <span>+5k visitas/mes</span>
            <span>Publico segmentado</span>
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md mb-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">PawStore</h2>
        <p className="text-gray-600">Produtos, serviços e muito mais para o seu pet</p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          placeholder="Pesquisar produtos, serviços..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl border-gray-300 shadow-md bg-white text-gray-900"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
        {categories.map(cat => (
          <Button
            key={cat.id}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition-all ${
              selectedCategory === cat.id 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-sm'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <StoreItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loja em Construcao</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Em breve teremos produtos e servicos incriveis para o seu pet!
          </p>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-md h-11 px-6"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Anuncie seu Negocio Aqui
          </Button>
        </div>
      )}

      {/* CTA for Businesses */}
      <Card className="p-6 border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mt-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">Tem um PetShop ou oferece servicos?</h4>
              <p className="text-gray-600">Venda os seus produtos e servicos na PawStore</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap rounded-lg font-semibold shadow-md h-11 px-6"
          >
            Comecar a Vender
          </Button>
        </div>
      </Card>
    </div>
  );
}