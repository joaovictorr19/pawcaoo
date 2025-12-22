import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShoppingCart, Calendar, Star, Clock, Megaphone, 
  Search, Filter, SlidersHorizontal, X, ChevronDown,
  Truck, Heart, Store, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

// Mock Data - Marketplace Híbrido
const storeItems = [
  {
    id: 1,
    type: 'product',
    category: 'Alimentação',
    title: 'Ração Premium Natural 15kg',
    brand: 'Royal Canin',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1585499193151-0f515432bc69?auto=format&fit=crop&q=80&w=400',
    badge: 'Envio Grátis'
  },
  {
    id: 2,
    type: 'service',
    category: 'Estética',
    title: 'Banho & Tosa Completa',
    provider: 'PetShop Bonfim',
    price: 'A partir de 25€',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400',
    duration: '1h 30m'
  },
  {
    id: 3,
    type: 'ad_slot',
    title: 'A sua marca aqui!',
    description: 'Alcance milhares de donos de pets em Portugal.',
    cta: 'Criar Anúncio'
  },
  {
    id: 4,
    type: 'product',
    category: 'Acessórios',
    title: 'Coleira de Couro Personalizada',
    brand: 'PawCraft',
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1605639176478-95e51f9c008a?auto=format&fit=crop&q=80&w=400',
    badge: 'Feito à Mão'
  },
  {
    id: 5,
    type: 'service',
    category: 'Veterinária',
    title: 'Consulta de Check-up Geral',
    provider: 'Clínica Vet Central',
    price: '40€',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1628009368231-76033527212e?auto=format&fit=crop&q=80&w=400',
    availability: 'Hoje'
  },
  {
    id: 6,
    type: 'product',
    category: 'Brinquedos',
    title: 'Kit Brinquedos Interativos',
    brand: 'FunPet',
    price: 18.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&q=80&w=400',
    badge: '-24%'
  },
  {
    id: 7,
    type: 'service',
    category: 'Treino',
    title: 'Aula de Obediência Básica',
    provider: 'K9 Academy',
    price: 'A partir de 35€',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400',
    duration: '45m'
  },
  {
    id: 8,
    type: 'product',
    category: 'Higiene',
    title: 'Champô Hipoalergénico 500ml',
    brand: 'VetCare',
    price: 8.90,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400',
  }
];

const categories = [
  { id: 'all', label: 'Todos', icon: '🛒' },
  { id: 'Alimentação', label: 'Alimentação', icon: '🍖' },
  { id: 'Acessórios', label: 'Acessórios', icon: '🎀' },
  { id: 'Brinquedos', label: 'Brinquedos', icon: '🎾' },
  { id: 'Higiene', label: 'Higiene', icon: '🧴' },
  { id: 'Veterinária', label: 'Veterinária', icon: '🏥' },
  { id: 'Estética', label: 'Estética', icon: '✂️' },
  { id: 'Treino', label: 'Treino', icon: '🎓' },
];

// Product Card Component
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
            src={item.image} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Badge */}
          {item.badge && (
            <Badge className={`absolute top-3 left-3 ${
              item.badge.includes('%') 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            } shadow-lg`}>
              {item.badge.includes('Envio') && <Truck className="w-3 h-3 mr-1" />}
              {item.badge}
            </Badge>
          )}

          {/* Favorite Button */}
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <CardContent className="p-4">
          {/* Brand */}
          {item.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.brand}</p>
          )}
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-gray-900">
              €{item.price.toFixed(2)}
            </span>
            {item.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                €{item.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11">
            <ShoppingCart className="w-4 h-4" />
            Adicionar ao Carrinho
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Service Card Component
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
            src={item.image} 
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Availability Badge */}
          {item.availability && (
            <Badge className="absolute top-3 left-3 bg-green-500 text-white shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              Disponível {item.availability}
            </Badge>
          )}

          {/* Duration Badge */}
          {item.duration && (
            <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 shadow-md">
              <Clock className="w-3 h-3 mr-1" />
              {item.duration}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Provider */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <Store className="w-3 h-3 text-green-600" />
            </div>
            <p className="text-xs text-green-600 font-medium">{item.provider}</p>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-gray-900">{item.rating}</span>
            <span className="text-sm text-gray-500">(128 avaliações)</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-lg font-bold text-gray-900">{item.price}</span>
          </div>

          {/* Book Button */}
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11">
            <Calendar className="w-4 h-4" />
            Agendar
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Ad Slot Card Component
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
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
            <Megaphone className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 max-w-[200px]">
            {item.description}
          </p>

          {/* CTA Button */}
          <Button 
            onClick={() => navigate(createPageUrl('RegisterCompany'))}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 px-8 h-12 text-base"
          >
            <Megaphone className="w-5 h-5" />
            {item.cta}
          </Button>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
            <span>📈 +5k visitas/mês</span>
            <span>🎯 Público segmentado</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Store Item Card (Router)
function StoreItemCard({ item }) {
  switch (item.type) {
    case 'product':
      return <ProductCard item={item} />;
    case 'service':
      return <ServiceCard item={item} />;
    case 'ad_slot':
      return <AdSlotCard item={item} />;
    default:
      return null;
  }
}

export default function PawStore() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTypes, setSelectedTypes] = useState(['product', 'service', 'ad_slot']);
  const [showFilters, setShowFilters] = useState(false);

  // Filter items
  const filteredItems = storeItems.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.provider?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedTypes.includes(item.type);
    return matchesSearch && matchesCategory && matchesType;
  });

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              🐾 PawStore
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Produtos, serviços e muito mais para o seu pet
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Pesquisar produtos, serviços, marcas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-14 text-lg rounded-2xl border-0 shadow-xl text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <Card className="p-4 border-0 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categorias
                </h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Type Filter */}
              <Card className="p-4 border-0 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Tipo
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedTypes.includes('product')}
                      onCheckedChange={() => toggleType('product')}
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Produtos</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedTypes.includes('service')}
                      onCheckedChange={() => toggleType('service')}
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Serviços</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox 
                      checked={selectedTypes.includes('ad_slot')}
                      onCheckedChange={() => toggleType('ad_slot')}
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Oportunidades</span>
                    </div>
                  </label>
                </div>
              </Card>

              {/* CTA for Businesses */}
              <Card className="p-4 border-2 border-dashed border-purple-200 bg-purple-50">
                <div className="text-center">
                  <Store className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-900 mb-1">Tem um negócio?</h4>
                  <p className="text-xs text-gray-600 mb-3">Venda os seus produtos na PawStore</p>
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                    Começar a Vender
                  </Button>
                </div>
              </Card>
            </div>
          </aside>

          {/* Mobile Filters Toggle */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
              {categories.slice(0, 4).map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.icon} {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden"
              >
                <Card className="p-4 mb-4 border-0 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Filtros</h3>
                    <Button size="icon" variant="ghost" onClick={() => setShowFilters(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <Button
                        key={cat.id}
                        size="sm"
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.icon} {cat.label}
                      </Button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content - Grid */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredItems.length}</span> resultados
                {selectedCategory !== 'all' && (
                  <span> em <Badge variant="secondary">{selectedCategory}</Badge></span>
                )}
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <StoreItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-600 mb-4">Tente ajustar os filtros ou pesquisar por outro termo</p>
                <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                  Limpar Filtros
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}